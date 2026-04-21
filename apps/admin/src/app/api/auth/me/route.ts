import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  try {
    const { userId } = await getAdminUser();
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
