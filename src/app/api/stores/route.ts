import { db } from "@/db";
import { stores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export const dynamic = "force-dynamic";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let rows: typeof stores.$inferSelect[] = [];
    // Admin tüm mağazaları görür; manager/staff sadece kendi mağazasını görür
    if (user.role === "admin") {
      rows = await db.select().from(stores).orderBy(desc(stores.createdAt));
    } else if (user.storeId) {
      rows = await db.select().from(stores).where(eq(stores.id, user.storeId));
    } else {
      rows = [];
    }

    return Response.json(rows);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Mağazalar getirilemedi" }, { status: 500 });
  }
}

import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const body = await req.json();
    if (!body?.name || String(body.name).trim() === "") {
      return Response.json({ error: "Mağaza adı zorunludur" }, { status: 400 });
    }
    const [row] = await db
      .insert(stores)
      .values({
        name: String(body.name).trim(),
        code: body.code || null,
        manager: body.manager || null,
        phone: body.phone || null,
        email: body.email || null,
        city: body.city || null,
        address: body.address || null,
        status: body.status || "aktif",
        notes: body.notes || null,
      })
      .returning();

    await logActivity(
      user.id,
      "Mağaza Eklendi",
      "stores",
      row.id,
      `Yeni mağaza oluşturuldu: ${row.name}`
    );

    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Mağaza eklenemedi" }, { status: 500 });
  }
}
