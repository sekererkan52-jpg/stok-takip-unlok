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
    if (!user) {
      return Response.json({ error: "Oturum açılmadı." }, { status: 401 });
    }

    const { id } = await params;
    const storeId = Number(id);

    const isAuthorized = user.role === "admin" || (user.role === "manager" && user.storeId === storeId);
    if (!isAuthorized) {
      return Response.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const body = await req.json();
    let updateFields: any = {};

    if (user.role === "admin") {
      if (!body?.name || String(body.name).trim() === "") {
        return Response.json({ error: "Mağaza adı zorunludur" }, { status: 400 });
      }
      updateFields = {
        name: String(body.name).trim(),
        code: body.code || null,
        manager: body.manager || null,
        phone: body.phone || null,
        email: body.email || null,
        city: body.city || null,
        address: body.address || null,
        status: body.status || "aktif",
        notes: body.notes || null,
      };
    } else {
      // manager updating only phone and address
      const [existing] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, storeId));
      
      if (!existing) {
        return Response.json({ error: "Mağaza bulunamadı" }, { status: 404 });
      }

      updateFields = {
        name: existing.name,
        code: existing.code,
        manager: existing.manager,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: existing.email,
        city: existing.city,
        address: body.address !== undefined ? body.address : existing.address,
        status: existing.status,
        notes: existing.notes,
      };
    }

    const [row] = await db
      .update(stores)
      .set(updateFields)
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
