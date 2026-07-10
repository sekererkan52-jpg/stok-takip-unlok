import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return Response.json({ error: "Yetkisiz erişim. Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const rows = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entity: activityLogs.entity,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        userFullName: users.fullName,
        username: users.username,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(50);

    return Response.json(rows);
  } catch (e) {
    console.error("GET activity logs error:", e);
    return Response.json({ error: "Aktivite günlükleri alınamadı" }, { status: 500 });
  }
}
