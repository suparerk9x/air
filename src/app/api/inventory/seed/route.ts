import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/inventory/seed — create demo inventory data
export async function POST() {
  // ─── Items ───
  const items = [
    // LINEN
    { name: "Bed Sheet (Queen)", category: "LINEN" as const, unit: "set", minStock: 4, usagePerCheckout: 1 },
    { name: "Bed Sheet (Single)", category: "LINEN" as const, unit: "set", minStock: 4, usagePerCheckout: 1 },
    { name: "Bath Towel", category: "LINEN" as const, unit: "pcs", minStock: 6, usagePerCheckout: 2 },
    { name: "Hand Towel", category: "LINEN" as const, unit: "pcs", minStock: 6, usagePerCheckout: 2 },
    { name: "Pillow Case", category: "LINEN" as const, unit: "pcs", minStock: 6, usagePerCheckout: 2 },
    { name: "Duvet Cover", category: "LINEN" as const, unit: "pcs", minStock: 2, usagePerCheckout: 1 },
    // AMENITY
    { name: "Shampoo (30ml)", category: "AMENITY" as const, unit: "bottle", minStock: 10, usagePerCheckout: 1 },
    { name: "Body Wash (30ml)", category: "AMENITY" as const, unit: "bottle", minStock: 10, usagePerCheckout: 1 },
    { name: "Toothbrush Kit", category: "AMENITY" as const, unit: "set", minStock: 10, usagePerCheckout: 1 },
    { name: "Coffee Capsules", category: "AMENITY" as const, unit: "pcs", minStock: 20, usagePerCheckout: 4 },
    { name: "Drinking Water (500ml)", category: "AMENITY" as const, unit: "bottle", minStock: 12, usagePerCheckout: 2 },
    // CONSUMABLE
    { name: "Trash Bag", category: "CONSUMABLE" as const, unit: "pcs", minStock: 20, usagePerCheckout: 2 },
    { name: "Toilet Paper", category: "CONSUMABLE" as const, unit: "roll", minStock: 10, usagePerCheckout: 1 },
    { name: "Tissue Box", category: "CONSUMABLE" as const, unit: "box", minStock: 5, usagePerCheckout: 1 },
    { name: "Cleaning Solution", category: "CONSUMABLE" as const, unit: "bottle", minStock: 3, usagePerCheckout: 0 },
    // EQUIPMENT
    { name: "TV Remote", category: "EQUIPMENT" as const, unit: "pcs", minStock: 1, usagePerCheckout: 0 },
    { name: "AC Remote", category: "EQUIPMENT" as const, unit: "pcs", minStock: 1, usagePerCheckout: 0 },
    { name: "Room Key Card", category: "EQUIPMENT" as const, unit: "pcs", minStock: 3, usagePerCheckout: 0 },
    { name: "Hair Dryer", category: "EQUIPMENT" as const, unit: "pcs", minStock: 1, usagePerCheckout: 0 },
    { name: "Universal Adapter", category: "EQUIPMENT" as const, unit: "pcs", minStock: 2, usagePerCheckout: 0 },
    // MAINTENANCE
    { name: "Light Bulb (LED)", category: "MAINTENANCE" as const, unit: "pcs", minStock: 5, usagePerCheckout: 0 },
    { name: "AC Filter", category: "MAINTENANCE" as const, unit: "pcs", minStock: 2, usagePerCheckout: 0 },
    { name: "Faucet Washer", category: "MAINTENANCE" as const, unit: "pcs", minStock: 3, usagePerCheckout: 0 },
  ];

  const created = [];
  for (const item of items) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      created.push(await prisma.inventoryItem.create({ data: item }));
    } else {
      created.push(existing);
    }
  }

  // ─── Stock per property ───
  const properties = await prisma.property.findMany();
  for (const prop of properties) {
    for (const item of created) {
      const qty = item.category === "EQUIPMENT" ? 1 + Math.floor(Math.random() * 2) :
                  item.category === "MAINTENANCE" ? 2 + Math.floor(Math.random() * 5) :
                  item.category === "LINEN" ? 3 + Math.floor(Math.random() * 8) :
                  5 + Math.floor(Math.random() * 20);

      await prisma.propertyStock.upsert({
        where: { propertyId_itemId: { propertyId: prop.id, itemId: item.id } },
        create: { propertyId: prop.id, itemId: item.id, quantity: qty },
        update: { quantity: qty },
      });
    }
  }

  // ─── Sample maintenance tasks ───
  if (properties.length > 0) {
    const prop = properties[0];
    await prisma.maintenanceTask.createMany({
      data: [
        { title: "AC not cooling properly", propertyId: prop.id, priority: "HIGH", status: "OPEN" },
        { title: "Replace bathroom light bulb", propertyId: prop.id, priority: "MEDIUM", status: "IN_PROGRESS", assignee: "Somchai" },
        { title: "Fix leaky faucet", propertyId: properties[1]?.id || prop.id, priority: "LOW", status: "OPEN" },
      ],
    });
  }

  // ─── Sample stock logs ───
  const bathTowel = created.find((i) => i.name === "Bath Towel");
  if (bathTowel && properties.length > 0) {
    await prisma.stockLog.createMany({
      data: [
        { itemId: bathTowel.id, propertyId: properties[0].id, type: "RESTOCK", quantity: 10, note: "Monthly restock", cost: 1500 },
        { itemId: bathTowel.id, propertyId: properties[0].id, type: "CHECKOUT_USE", quantity: -2, note: "John Smith checkout" },
        { itemId: bathTowel.id, propertyId: properties[0].id, type: "CHECKOUT_USE", quantity: -2, note: "Maria Garcia checkout" },
      ],
    });
  }

  return NextResponse.json({
    success: true,
    items: created.length,
    properties: properties.length,
  });
}
