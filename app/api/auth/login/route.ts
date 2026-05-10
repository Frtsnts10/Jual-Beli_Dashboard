import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (username === adminUsername && password === adminPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  }

  return NextResponse.json(
    { success: false, error: "Invalid credentials" },
    { status: 401 }
  );
}
