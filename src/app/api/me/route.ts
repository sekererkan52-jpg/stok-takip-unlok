import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
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
    
    return NextResponse.json({
      id: payload.id,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role,
      storeId: payload.storeId
    });
  } catch (error) {
    console.error("Me API error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
