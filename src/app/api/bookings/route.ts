import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  getUserPropertyIds,
  verifyPropertyOwnership,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// GET /api/bookings?from=&to=&propertyId=
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const userPropertyIds = await getUserPropertyIds(userId);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const propertyId = searchParams.get("propertyId");

    const where: Record<string, unknown> = {
      propertyId: { in: userPropertyIds },
    };

    if (from) where.startDate = { gte: new Date(from) };
    if (to) {
      where.endDate = where.endDate || {};
      (where.endDate as Record<string, unknown>).lte = new Date(to);
    }
    if (propertyId) {
      if (!userPropertyIds.includes(propertyId)) return forbiddenResponse();
      where.propertyId = propertyId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { property: { select: { name: true, color: true } } },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(bookings);
  } catch {
    return unauthorizedResponse();
  }
}

// POST /api/bookings - create manual booking
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const { summary, startDate, endDate, propertyId, status, notes } = body;

    if (!startDate || !endDate || !propertyId) {
      return NextResponse.json(
        { error: "startDate, endDate, and propertyId are required" },
        { status: 400 }
      );
    }

    if (!(await verifyPropertyOwnership(propertyId, userId))) {
      return forbiddenResponse();
    }

    const booking = await prisma.booking.create({
      data: {
        summary,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        propertyId,
        status: status || "CONFIRMED",
        source: "manual",
        notes,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch {
    return unauthorizedResponse();
  }
}
