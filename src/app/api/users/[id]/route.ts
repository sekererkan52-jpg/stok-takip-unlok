import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);
    const body = await req.json();

    if (!body.fullName || String(body.fullName).trim() === "") {
      return NextResponse.json({ error: "Ad Soyad zorunludur." }, { status: 400 });
    }

    const updateData: any = {
      fullName: String(body.fullName).trim(),
      role: body.role || "staff",
      active: body.active !== undefined ? Number(body.active) : 1,
      storeId: body.storeId ? Number(body.storeId) : null,
    };

    // If updating password
    if (body.password && String(body.password).trim() !== "") {
      updateData.passwordHash = await argon2.hash(body.password);
    }

    // Safety: Admin cannot deactivate themselves or change their own role to non-admin
    if (userId === admin.id) {
      updateData.active = 1;
      updateData.role = "admin";
      delete updateData.storeId;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        active: users.active,
        storeId: users.storeId,
      });

    if (!updated) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    await logActivity(
      admin.id,
      "Kullanıcı Güncellendi",
      "users",
      updated.id,
      `Kullanıcı bilgileri güncellendi: @${updated.username}`
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT user error:", error);
    return NextResponse.json({ error: "Kullanıcı güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);

    // Prevent self deletion
    if (userId === admin.id) {
      return NextResponse.json({ error: "Kendinizi silemezsiniz." }, { status: 400 });
    }

    // Get username before delete
    const [userToDelete] = await db.select().from(users).where(eq(users.id, userId));
    if (!userToDelete) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, userId));

    await logActivity(
      admin.id,
      "Kullanıcı Silindi",
      "users",
      userId,
      `Kullanıcı silindi: @${userToDelete.username}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Kullanıcı silinemedi." }, { status: 500 });
  }
}
