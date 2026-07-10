import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { signToken } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.username || !body.password) {
      return NextResponse.json({
        success: false,
        error: "Kullanıcı adı ve şifre gereklidir."
      }, { status: 400 });
    }

    const user = await loginUser(
      body.username,
      body.password
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Kullanıcı adı veya şifre hatalı."
      });
    }

    // Sign the token with user info
    const token = await signToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      storeId: user.storeId
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax"
    });

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({
      success: false,
      error: "Sunucu hatası oluştu."
    }, { status: 500 });
  }
}