import { db } from "@/db";
import { processes, stores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: processes.id,
        storeId: processes.storeId,
        title: processes.title,
        description: processes.description,
        category: processes.category,
        status: processes.status,
        priority: processes.priority,
        assignedTo: processes.assignedTo,
        dueDate: processes.dueDate,
        createdAt: processes.createdAt,
        storeName: stores.name,
      })
      .from(processes)
      .leftJoin(stores, eq(processes.storeId, stores.id))
      .orderBy(desc(processes.createdAt));
    return Response.json(rows);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Süreçler getirilemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.storeId) {
      return Response.json({ error: "Mağaza seçimi zorunludur" }, { status: 400 });
    }
    if (!body?.title || String(body.title).trim() === "") {
      return Response.json({ error: "Süreç başlığı zorunludur" }, { status: 400 });
    }
    const [row] = await db
      .insert(processes)
      .values({
        storeId: Number(body.storeId),
        title: String(body.title).trim(),
        description: body.description || null,
        category: body.category || null,
        status: body.status || "beklemede",
        priority: body.priority || "orta",
        assignedTo: body.assignedTo || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .returning();
    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Süreç eklenemedi" }, { status: 500 });
  }
}
