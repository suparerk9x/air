import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/properties - list all properties with bookings
export async function GET() {
  // TODO: filter by authenticated user
  const properties = await prisma.property.findMany({
    include: {
      bookings: {
        orderBy: { startDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(properties);
}

// POST /api/properties - create a new property
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, address, icalUrl, color, platform, notes, userId } = body;

  if (!name || !userId) {
    return NextResponse.json(
      { error: "name and userId are required" },
      { status: 400 }
    );
  }

  const property = await prisma.property.create({
    data: {
      name,
      address,
      icalUrl,
      color: color || "#3b82f6",
      platform,
      notes,
      userId,
    },
  });

  return NextResponse.json(property, { status: 201 });
}
