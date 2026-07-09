import { db } from "@/db";
import { inventory } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const itemId = Number(id);
    await db.delete(inventory).where(eq(inventory.id, itemId));
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Ürün silinemedi" }, { status: 500 });
  }
}
