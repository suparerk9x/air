import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// PUT /api/ical-feeds/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await req.json();

    const feed = await prisma.iCalFeed.findUnique({
      where: { id },
      include: { property: { select: { userId: true } } },
    });

    if (!feed || feed.property.userId !== userId) {
      return forbiddenResponse();
    }

    const updated = await prisma.iCalFeed.update({
      where: { id },
      data: {
        url: body.url ?? feed.url,
        label: body.label !== undefined ? body.label : feed.label,
        platform: body.platform ?? feed.platform,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return unauthorizedResponse();
  }
}

// DELETE /api/ical-feeds/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    const feed = await prisma.iCalFeed.findUnique({
      where: { id },
      include: { property: { select: { userId: true } } },
    });

    if (!feed || feed.property.userId !== userId) {
      return forbiddenResponse();
    }

    await prisma.iCalFeed.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
