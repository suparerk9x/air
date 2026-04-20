import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  getUserPropertyIds,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// GET /api/bookings/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const userPropertyIds = await getUserPropertyIds(userId);

    const booking = await prisma.booking.findFirst({
      where: { id, propertyId: { in: userPropertyIds } },
      include: { property: { select: { name: true, color: true } } },
    });

    if (!booking) return forbiddenResponse();

    return NextResponse.json(booking);
  } catch {
    return unauthorizedResponse();
  }
}
