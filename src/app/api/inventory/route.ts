import { db } from "@/db";
import { inventory, stores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: inventory.id,
        storeId: inventory.storeId,
        productName: inventory.productName,
        sku: inventory.sku,
        category: inventory.category,
        quantity: inventory.quantity,
        unit: inventory.unit,
        price: inventory.price,
        minStock: inventory.minStock,
        notes: inventory.notes,
        createdAt: inventory.createdAt,
        storeName: stores.name,
      })
      .from(inventory)
      .leftJoin(stores, eq(inventory.storeId, stores.id))
      .orderBy(desc(inventory.createdAt));
    return Response.json(rows);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Envanter getirilemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.storeId) {
      return Response.json({ error: "Mağaza seçimi zorunludur" }, { status: 400 });
    }
    if (!body?.productName || String(body.productName).trim() === "") {
      return Response.json({ error: "Ürün adı zorunludur" }, { status: 400 });
    }
    const [row] = await db
      .insert(inventory)
      .values({
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
      .returning();
    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Ürün eklenemedi" }, { status: 500 });
  }
}
