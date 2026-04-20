import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, getUserPropertyIds, unauthorizedResponse } from "@/lib/auth-api";

// GET /api/inventory/items — list items with stock scoped to user's properties
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const userPropertyIds = await getUserPropertyIds(userId);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        propertyStocks: {
          where: { propertyId: { in: userPropertyIds } },
          include: { property: { select: { id: true, name: true, color: true } } },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const result = items.map((item) => {
      const totalStock = item.propertyStocks.reduce((sum, ps) => sum + ps.quantity, 0);
      const isLowStock = totalStock <= item.minStock;
      return { ...item, totalStock, isLowStock };
    });

    return NextResponse.json(result);
  } catch {
    return unauthorizedResponse();
  }
}

// POST /api/inventory/items — create new item
export async function POST(req: NextRequest) {
  try {
    await getAuthUserId();
    const body = await req.json();
    const { name, category, unit, description, minStock, usagePerCheckout } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "name and category required" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        unit: unit || "pcs",
        description,
        minStock: minStock ?? 5,
        usagePerCheckout: usagePerCheckout ?? 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return unauthorizedResponse();
  }
}
