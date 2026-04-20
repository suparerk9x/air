import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/inventory/maintenance
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (propertyId) where.propertyId = propertyId;
  if (status) where.status = status;

  const tasks = await prisma.maintenanceTask.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

// POST /api/inventory/maintenance
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, propertyId, priority, dueDate, assignee, itemId } = body;

  if (!title || !propertyId) {
    return NextResponse.json({ error: "title and propertyId required" }, { status: 400 });
  }

  const task = await prisma.maintenanceTask.create({
    data: {
      title,
      description,
      propertyId,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      assignee,
      itemId,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
