import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/properties/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: { bookings: { orderBy: { startDate: "asc" } } },
  });

  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(property);
}

// PUT /api/properties/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, address, icalUrl, color, platform, notes } = body;

  const property = await prisma.property.update({
    where: { id },
    data: { name, address, icalUrl, color, platform, notes },
  });

  return NextResponse.json(property);
}

// DELETE /api/properties/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
