import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const storeId = Number(id);
    await db.delete(stores).where(eq(stores.id, storeId));
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Mağaza silinemedi" }, { status: 500 });
  }
}
