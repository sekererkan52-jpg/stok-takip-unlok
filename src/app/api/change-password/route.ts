import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Giriş yapılmamış" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş oturum" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mevcut şifre ve yeni şifre alanları zorunludur." },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 4) {
      return NextResponse.json(
        { error: "Yeni şifre en az 4 karakter olmalıdır." },
        { status: 400 }
      );
    }

    // Fetch user from DB to get the password hash
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await argon2.verify(dbUser.passwordHash, currentPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Mevcut şifreniz hatalı." }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await argon2.hash(newPassword);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: 0,
      })
      .where(eq(users.id, payload.id));

    // Log activity
    await logActivity(
      payload.id,
      "Şifre Değiştirildi",
      "users",
      payload.id,
      `Kullanıcı kendi şifresini güncelledi.`
    );

    return NextResponse.json({ success: true, message: "Şifreniz başarıyla güncellendi." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
