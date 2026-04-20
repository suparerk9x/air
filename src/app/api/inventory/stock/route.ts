import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/inventory/stock — update stock + log the movement
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, propertyId, type, quantity, note, cost, bookingId } = body;

  if (!itemId || !type || quantity === undefined) {
    return NextResponse.json(
      { error: "itemId, type, and quantity required" },
      { status: 400 }
    );
  }

  // Upsert property stock
  if (propertyId) {
    await prisma.propertyStock.upsert({
      where: { propertyId_itemId: { propertyId, itemId } },
      create: { propertyId, itemId, quantity: Math.max(0, quantity) },
      update: { quantity: { increment: quantity } },
    });

    // Ensure stock doesn't go negative
    const stock = await prisma.propertyStock.findUnique({
      where: { propertyId_itemId: { propertyId, itemId } },
    });
    if (stock && stock.quantity < 0) {
      await prisma.propertyStock.update({
        where: { id: stock.id },
        data: { quantity: 0 },
      });
    }
  }

  // Create log entry
  const log = await prisma.stockLog.create({
    data: {
      itemId,
      propertyId,
      type,
      quantity,
      note,
      cost,
      bookingId,
    },
  });

  return NextResponse.json(log, { status: 201 });
}

// GET /api/inventory/stock — get stock logs with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const propertyId = searchParams.get("propertyId");
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (itemId) where.itemId = itemId;
  if (propertyId) where.propertyId = propertyId;
  if (type) where.type = type;

  const logs = await prisma.stockLog.findMany({
    where,
    include: {
      item: { select: { name: true, unit: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
