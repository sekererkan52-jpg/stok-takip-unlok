import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(
  userId: number,
  action: string,
  entity?: string,
  entityId?: number,
  details?: string
) {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      entity: entity || null,
      entityId: entityId || null,
      details: details || null,
    });
  } catch (e) {
    console.error("Activity logging failed:", e);
  }
}
