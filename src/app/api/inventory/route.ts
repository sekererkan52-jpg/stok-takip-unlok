import { db } from "@/db";
import { inventory, stores } from "@/db/schema";
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

    const query = db
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
      .leftJoin(stores, eq(inventory.storeId, stores.id));

    let rows: Array<{
      id: number;
      storeId: number;
      productName: string;
      sku: string | null;
      category: string | null;
      quantity: number;
      unit: string | null;
      price: string | null;
      minStock: number | null;
      notes: string | null;
      createdAt: Date;
      storeName: string | null;
    }> = [];

    if (user.role === "admin") {
      rows = await query.orderBy(desc(inventory.createdAt));
    } else if (user.storeId) {
      rows = await query.where(eq(inventory.storeId, user.storeId)).orderBy(desc(inventory.createdAt));
    } else {
      rows = [];
    }

    return Response.json(rows);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Envanter getirilemedi" }, { status: 500 });
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

    await logActivity(
      user.id,
      "Ürün Eklendi",
      "inventory",
      row.id,
      `Yeni ürün eklendi: ${row.productName} (${row.quantity} ${row.unit})`
    );

    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Ürün eklenemedi" }, { status: 500 });
  }
}
