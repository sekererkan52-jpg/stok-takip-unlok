import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
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

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return Response.json({ error: "Yetkisiz erişim. Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const actionParam = searchParams.get("action");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const conditions = [];

    if (actionParam && actionParam.trim() !== "") {
      conditions.push(eq(activityLogs.action, actionParam));
    }

    if (startDateParam && startDateParam.trim() !== "") {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(activityLogs.createdAt, start));
    }

    if (endDateParam && endDateParam.trim() !== "") {
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(activityLogs.createdAt, end));
    }

    let queryBuilder = db
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
      .leftJoin(users, eq(activityLogs.userId, users.id));

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    const rows = await queryBuilder
      .orderBy(desc(activityLogs.createdAt))
      .limit(200);

    return Response.json(rows);
  } catch (e) {
    console.error("GET activity logs error:", e);
    return Response.json({ error: "Aktivite günlükleri alınamadı" }, { status: 500 });
  }
}
