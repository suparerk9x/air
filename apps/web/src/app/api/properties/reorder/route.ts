import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorizedResponse } from "@/lib/auth-api";

// PUT /api/properties/reorder — update sort order for all properties
export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const { order } = body as { order: string[] }; // array of property IDs in desired order

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order must be an array of property IDs" }, { status: 400 });
    }

    // Verify all properties belong to this user
    const properties = await prisma.property.findMany({
      where: { userId },
      select: { id: true },
    });
    const userPropertyIds = new Set(properties.map((p) => p.id));

    for (const id of order) {
      if (!userPropertyIds.has(id)) {
        return NextResponse.json({ error: "Invalid property ID" }, { status: 403 });
      }
    }

    // Update sort orders in a transaction
    await prisma.$transaction(
      order.map((id, index) =>
        prisma.property.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
