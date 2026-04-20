import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  verifyPropertyOwnership,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// GET /api/properties/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    const property = await prisma.property.findFirst({
      where: { id, userId },
      include: { bookings: { orderBy: { startDate: "asc" } } },
    });

    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch {
    return unauthorizedResponse();
  }
}

// PUT /api/properties/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    if (!(await verifyPropertyOwnership(id, userId))) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const { name, address, icalUrl, color, platform, notes } = body;

    const property = await prisma.property.update({
      where: { id },
      data: { name, address, icalUrl, color, platform, notes },
    });

    return NextResponse.json(property);
  } catch {
    return unauthorizedResponse();
  }
}

// DELETE /api/properties/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    if (!(await verifyPropertyOwnership(id, userId))) {
      return forbiddenResponse();
    }

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
