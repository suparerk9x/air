import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/bookings/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/bookings/:id - update status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
}
