import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { db } from "@/db";
import { users, stores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        active: users.active,
        mustChangePassword: users.mustChangePassword,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        storeId: users.storeId,
        storeName: stores.name,
      })
      .from(users)
      .leftJoin(stores, eq(users.storeId, stores.id))
      .orderBy(desc(users.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Kullanıcılar getirilemedi." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const body = await req.json();
    if (!body.username || String(body.username).trim() === "") {
      return NextResponse.json({ error: "Kullanıcı adı zorunludur." }, { status: 400 });
    }
    if (!body.fullName || String(body.fullName).trim() === "") {
      return NextResponse.json({ error: "Ad Soyad zorunludur." }, { status: 400 });
    }
    if (!body.password || String(body.password).trim() === "") {
      return NextResponse.json({ error: "Şifre zorunludur." }, { status: 400 });
    }

    const username = String(body.username).trim().toLowerCase();

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 400 });
    }

    const passwordHash = await argon2.hash(body.password);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        fullName: String(body.fullName).trim(),
        passwordHash,
        role: body.role || "user",
        active: body.active !== undefined ? Number(body.active) : 1,
        mustChangePassword: body.mustChangePassword !== undefined ? Number(body.mustChangePassword) : 0,
        storeId: body.storeId ? Number(body.storeId) : null,
      })
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        active: users.active,
        storeId: users.storeId,
      });

    await logActivity(
      admin.id,
      "Kullanıcı Tanımlandı",
      "users",
      newUser.id,
      `Yeni kullanıcı oluşturuldu: @${newUser.username} (${newUser.role})`
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST users error:", error);
    return NextResponse.json({ error: "Kullanıcı oluşturulamadı." }, { status: 500 });
  }
}
