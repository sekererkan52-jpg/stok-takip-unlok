import { db } from "@/db";
import { stores } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(stores).orderBy(desc(stores.createdAt));
    return Response.json(rows);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Mağazalar getirilemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Mağaza eklenemedi" }, { status: 500 });
  }
}
