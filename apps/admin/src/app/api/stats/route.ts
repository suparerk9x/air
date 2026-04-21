import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  try {
    await getAdminUser();

    const [totalUsers, totalProperties, totalBookings, recentUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.booking.count(),
        prisma.user.findMany({
          select: { id: true, email: true, name: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      totalUsers,
      activeUsers: totalUsers, // TODO: implement activation
      totalProperties,
      totalBookings,
      recentUsers,
    });
  } catch {
    return unauthorizedResponse();
  }
}
