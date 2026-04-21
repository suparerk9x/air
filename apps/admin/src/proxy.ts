import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session-crypto";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/login";
  const isApiRoute = path.startsWith("/api/");

  if (isApiRoute) return NextResponse.next();

  const cookie = request.cookies.get("admin_session")?.value;
  const session = await decrypt(cookie);
  const isAdmin = session?.userId && session.role === "ADMIN";

  if (!isLoginPage && !isAdmin) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoginPage && isAdmin) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
