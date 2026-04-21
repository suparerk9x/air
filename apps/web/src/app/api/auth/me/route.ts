import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorizedResponse } from "@/lib/auth-api";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return unauthorizedResponse();
    return NextResponse.json(user);
  } catch {
    return unauthorizedResponse();
  }
}
