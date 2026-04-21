import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  verifyPropertyOwnership,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// GET /api/ical-feeds?propertyId=xxx (optional filter)
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const propertyId = req.nextUrl.searchParams.get("propertyId");

    // Get user's property IDs
    const userProperties = await prisma.property.findMany({
      where: { userId },
      select: { id: true },
    });
    const userPropertyIds = userProperties.map((p) => p.id);

    const where = propertyId
      ? { propertyId, property: { userId } }
      : { propertyId: { in: userPropertyIds } };

    const feeds = await prisma.iCalFeed.findMany({
      where,
      include: { property: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(feeds);
  } catch {
    return unauthorizedResponse();
  }
}

// POST /api/ical-feeds
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const { url, label, platform, propertyId } = body;

    if (!url || !propertyId) {
      return NextResponse.json(
        { error: "url and propertyId are required" },
        { status: 400 }
      );
    }

    if (!(await verifyPropertyOwnership(propertyId, userId))) {
      return forbiddenResponse();
    }

    const feed = await prisma.iCalFeed.create({
      data: {
        url,
        label: label || null,
        platform: platform || "airbnb",
        propertyId,
      },
    });

    return NextResponse.json(feed, { status: 201 });
  } catch {
    return unauthorizedResponse();
  }
}
