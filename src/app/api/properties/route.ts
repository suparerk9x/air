import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorizedResponse } from "@/lib/auth-api";

// GET /api/properties - list authenticated user's properties with bookings
export async function GET() {
  try {
    const userId = await getAuthUserId();

    const properties = await prisma.property.findMany({
      where: { userId },
      include: {
        bookings: {
          orderBy: { startDate: "asc" },
        },
        icalFeeds: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/properties error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/properties - create a new property for authenticated user
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const { name, address, icalUrl, color, platform, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
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
  } catch {
    return unauthorizedResponse();
  }
}
