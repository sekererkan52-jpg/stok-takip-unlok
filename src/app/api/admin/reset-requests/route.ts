import { db } from "@/db";
import { passwordResetRequests, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";
import argon2 from "argon2";

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
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.status, "beklemede"))
      .orderBy(desc(passwordResetRequests.createdAt));

    return Response.json(rows);
  } catch (e) {
    console.error("GET reset requests error:", e);
    return Response.json({ error: "Talepler alınamadı" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return Response.json({ error: "Yetkisiz erişim. Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const body = await req.json();
    const id = body?.id;

    if (!id) {
      return Response.json({ error: "Talep ID'si zorunludur" }, { status: 400 });
    }

    const [updated] = await db
      .update(passwordResetRequests)
      .set({ status: "tamamlandi" })
      .where(eq(passwordResetRequests.id, Number(id)))
      .returning();

    return Response.json(updated);
  } catch (e) {
    console.error("PUT reset request error:", e);
    return Response.json({ error: "Talep güncellenemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return Response.json({ error: "Yetkisiz erişim. Sadece yöneticiler erişebilir." }, { status: 403 });
    }

    const body = await req.json();
    const id = body?.id;
    const password = body?.password;

    if (!id || !password || String(password).trim() === "") {
      return Response.json({ error: "Talep ID'si ve yeni şifre zorunludur" }, { status: 400 });
    }

    // Sıfırlama talebini bulalım
    const [request] = await db
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.id, Number(id)));

    if (!request) {
      return Response.json({ error: "Talep bulunamadı." }, { status: 404 });
    }

    // Kullanıcıyı bulalım
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, request.username));

    if (!user) {
      // Talep var ama kullanıcı silinmiş olabilir, talebi kapatıp hata dönelim
      await db
        .update(passwordResetRequests)
        .set({ status: "tamamlandi" })
        .where(eq(passwordResetRequests.id, Number(id)));
      return Response.json({ error: "Kullanıcı bulunamadı. Talep kapatıldı." }, { status: 404 });
    }

    // Şifreyi hash'leyelim
    const passwordHash = await argon2.hash(String(password));

    // Kullanıcı şifresini güncelleyelim
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    // Talebi tamamlandı olarak güncelleyelim
    await db
      .update(passwordResetRequests)
      .set({ status: "tamamlandi" })
      .where(eq(passwordResetRequests.id, Number(id)));

    return Response.json({ success: true });
  } catch (e) {
    console.error("POST reset password request error:", e);
    return Response.json({ error: "Şifre sıfırlama başarısız oldu" }, { status: 500 });
  }
}
