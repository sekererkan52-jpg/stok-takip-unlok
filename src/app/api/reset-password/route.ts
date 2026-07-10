import { db } from "@/db";
import { users, passwordResetRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username?.trim().toLowerCase();

    if (!username) {
      return Response.json({ error: "Kullanıcı adı zorunludur" }, { status: 400 });
    }

    // Kullanıcı mevcut mu kontrol edelim
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      return Response.json({ error: "Belirtilen kullanıcı adı sistemde kayıtlı değil." }, { status: 404 });
    }

    // Şifre sıfırlama talebini ekleyelim
    const [row] = await db
      .insert(passwordResetRequests)
      .values({
        username,
        status: "beklemede",
      })
      .returning();

    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error("Password reset error:", e);
    return Response.json({ error: "Sıfırlama talebi gönderilemedi" }, { status: 500 });
  }
}
