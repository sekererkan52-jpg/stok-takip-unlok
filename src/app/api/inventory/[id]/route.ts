import { db } from "@/db";
import { inventory } from "@/db/schema";
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
    const itemId = Number(id);
    const body = await req.json();
    if (!body?.storeId) {
      return Response.json({ error: "Mağaza seçimi zorunludur" }, { status: 400 });
    }
    if (!body?.productName || String(body.productName).trim() === "") {
      return Response.json({ error: "Ürün adı zorunludur" }, { status: 400 });
    }
    const [row] = await db
      .update(inventory)
      .set({
        storeId: Number(body.storeId),
        productName: String(body.productName).trim(),
        sku: body.sku || null,
        category: body.category || null,
        quantity: Number(body.quantity) || 0,
        unit: body.unit || "adet",
        price: body.price ? String(body.price) : null,
        minStock: Number(body.minStock) || 0,
        notes: body.notes || null,
      })
      .where(eq(inventory.id, itemId))
      .returning();

    if (!row) return Response.json({ error: "Ürün bulunamadı" }, { status: 404 });

    await logActivity(
      user.id,
      "Ürün Güncellendi",
      "inventory",
      row.id,
      `Ürün güncellendi: ${row.productName} (Yeni miktar: ${row.quantity})`
    );

    return Response.json(row);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Ürün güncellenemedi" }, { status: 500 });
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
    const itemId = Number(id);

    // Get item info before delete
    const [item] = await db.select().from(inventory).where(eq(inventory.id, itemId));
    if (!item) return Response.json({ error: "Ürün bulunamadı" }, { status: 404 });

    await db.delete(inventory).where(eq(inventory.id, itemId));

    await logActivity(
      user.id,
      "Ürün Silindi",
      "inventory",
      itemId,
      `Ürün silindi: ${item.productName}`
    );

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Ürün silinemedi" }, { status: 500 });
  }
}
