import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, getUserPropertyIds, unauthorizedResponse } from "@/lib/auth-api";

// GET /api/inventory/today — dashboard data scoped to user's properties
export async function GET() {
  try {
    const userId = await getAuthUserId();
    const userPropertyIds = await getUserPropertyIds(userId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Bookings checking out today (endDate = today)
    const checkouts = await prisma.booking.findMany({
      where: {
        propertyId: { in: userPropertyIds },
        endDate: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["CANCELLED", "BLOCKED"] },
      },
      include: {
        property: { select: { id: true, name: true, color: true } },
      },
    });

    // Items with usagePerCheckout > 0
    const consumableItems = await prisma.inventoryItem.findMany({
      where: { usagePerCheckout: { gt: 0 } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const prepList = checkouts.map((booking) => ({
      bookingId: booking.id,
      guestName: booking.summary || "Reserved",
      propertyId: booking.property.id,
      propertyName: booking.property.name,
      propertyColor: booking.property.color,
      items: consumableItems.map((item) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.usagePerCheckout,
        unit: item.unit,
        category: item.category,
      })),
    }));

    // Low stock items scoped to user's properties
    const allItems = await prisma.inventoryItem.findMany({
      include: {
        propertyStocks: {
          where: { propertyId: { in: userPropertyIds } },
        },
      },
    });

    const lowStockItems = allItems
      .map((item) => {
        const totalStock = item.propertyStocks.reduce((s, ps) => s + ps.quantity, 0);
        return { ...item, totalStock, isLow: totalStock <= item.minStock };
      })
      .filter((item) => item.isLow);

    // Open maintenance tasks for user's properties
    const openTasks = await prisma.maintenanceTask.findMany({
      where: {
        propertyId: { in: userPropertyIds },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    // Bookings checking in today
    const checkins = await prisma.booking.findMany({
      where: {
        propertyId: { in: userPropertyIds },
        startDate: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["CANCELLED", "BLOCKED"] },
      },
      include: {
        property: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json({
      checkouts: prepList,
      checkins: checkins.map((b) => ({
        guestName: b.summary || "Reserved",
        propertyName: b.property.name,
        propertyColor: b.property.color,
      })),
      lowStockItems: lowStockItems.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        unit: i.unit,
        totalStock: i.totalStock,
        minStock: i.minStock,
      })),
      openTasks: openTasks.length,
      urgentTasks: openTasks.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length,
    });
  } catch {
    return unauthorizedResponse();
  }
}
