import { db } from "@/db";
import { processes, stores } from "@/db/schema";
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

    let rows: Array<{
      id: number; storeId: number; title: string; description: string | null;
      category: string | null; status: string; priority: string; assignedTo: string | null;
      dueDate: Date | null; createdAt: Date; storeName: string | null;
    }> = [];
    if (user.role === "admin") {
      // Admin tüm süreçleri görür
      rows = await db
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
    } else if (user.storeId) {
      // Manager/Staff sadece kendi mağazasının süreçlerini görür
      rows = await db
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
        .where(eq(processes.storeId, user.storeId))
        .orderBy(desc(processes.createdAt));
    } else {
      rows = [];
    }

    return Response.json(rows);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Süreçler getirilemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    if (!body?.storeId) {
      return Response.json({ error: "Mağaza seçimi zorunludur" }, { status: 400 });
    }
    if (!body?.title || String(body.title).trim() === "") {
      return Response.json({ error: "Süreç başlığı zorunludur" }, { status: 400 });
    }

    // Manager/Staff sadece kendi mağazasına süreç ekleyebilir
    if (user.role !== "admin" && user.storeId && Number(body.storeId) !== user.storeId) {
      return Response.json({ error: "Sadece kendi mağazanıza süreç ekleyebilirsiniz." }, { status: 403 });
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
