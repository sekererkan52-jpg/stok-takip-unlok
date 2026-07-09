import { db } from "@/db";
import { processes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const procId = Number(id);
    const body = await req.json();
    if (!body?.storeId) {
      return Response.json({ error: "Mağaza seçimi zorunludur" }, { status: 400 });
    }
    if (!body?.title || String(body.title).trim() === "") {
      return Response.json({ error: "Süreç başlığı zorunludur" }, { status: 400 });
    }
    const [row] = await db
      .update(processes)
      .set({
        storeId: Number(body.storeId),
        title: String(body.title).trim(),
        description: body.description || null,
        category: body.category || null,
        status: body.status || "beklemede",
        priority: body.priority || "orta",
        assignedTo: body.assignedTo || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .where(eq(processes.id, procId))
      .returning();
    if (!row) return Response.json({ error: "Süreç bulunamadı" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Süreç güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const procId = Number(id);
    await db.delete(processes).where(eq(processes.id, procId));
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Süreç silinemedi" }, { status: 500 });
  }
}
