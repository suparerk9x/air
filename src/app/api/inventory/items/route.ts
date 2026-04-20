import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/inventory/items — list all items with stock per property
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      propertyStocks: {
        include: { property: { select: { id: true, name: true, color: true } } },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Compute total stock + low stock flag
  const result = items.map((item) => {
    const totalStock = item.propertyStocks.reduce((sum, ps) => sum + ps.quantity, 0);
    const isLowStock = totalStock <= item.minStock;
    return { ...item, totalStock, isLowStock };
  });

  return NextResponse.json(result);
}

// POST /api/inventory/items — create new item
export async function POST(req: NextRequest) {
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
}
