import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { logActivity } from "@/lib/activity";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { id } = await params;
    const storeId = Number(id);
    const body = await req.json();
    if (!body?.name || String(body.name).trim() === "") {
      return Response.json({ error: "Mağaza adı zorunludur" }, { status: 400 });
    }
    const [row] = await db
      .update(stores)
      .set({
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
      .where(eq(stores.id, storeId))
      .returning();

    if (!row) return Response.json({ error: "Mağaza bulunamadı" }, { status: 404 });

    await logActivity(
      user.id,
      "Mağaza Güncellendi",
      "stores",
      row.id,
      `Mağaza güncellendi: ${row.name}`
    );

    return Response.json(row);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Mağaza güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { id } = await params;
    const storeId = Number(id);

    // Get store name before delete for the log
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) return Response.json({ error: "Mağaza bulunamadı" }, { status: 404 });

    await db.delete(stores).where(eq(stores.id, storeId));

    await logActivity(
      user.id,
      "Mağaza Silindi",
      "stores",
      storeId,
      `Mağaza silindi: ${store.name}`
    );

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Mağaza silinemedi" }, { status: 500 });
  }
}
