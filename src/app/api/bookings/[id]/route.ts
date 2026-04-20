import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  getUserPropertyIds,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

async function verifyBookingOwnership(bookingId: string, userId: string) {
  const userPropertyIds = await getUserPropertyIds(userId);
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, propertyId: { in: userPropertyIds } },
  });
  return !!booking;
}

// DELETE /api/bookings/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    if (!(await verifyBookingOwnership(id, userId))) {
      return forbiddenResponse();
    }

    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}

// PATCH /api/bookings/:id - update status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    if (!(await verifyBookingOwnership(id, userId))) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const { status, summary, notes } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (summary !== undefined) data.summary = summary;
    if (notes !== undefined) data.notes = notes;

    const booking = await prisma.booking.update({
      where: { id },
      data,
    });

    return NextResponse.json(booking);
  } catch {
    return unauthorizedResponse();
  }
}
