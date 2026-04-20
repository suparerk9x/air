import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session-crypto";

const publicRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  const isApiRoute = path.startsWith("/api/");

  // API routes handle their own auth (return 401 instead of redirect)
  if (isApiRoute) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  // Unauthenticated user trying to access protected route
  if (!isPublicRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Authenticated user trying to access login/register
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.png$).*)",
  ],
};
