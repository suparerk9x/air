import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  getUserPropertyIds,
  verifyPropertyOwnership,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// GET /api/inventory/maintenance
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const userPropertyIds = await getUserPropertyIds(userId);

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      propertyId: { in: userPropertyIds },
    };
    if (propertyId) {
      if (!userPropertyIds.includes(propertyId)) return forbiddenResponse();
      where.propertyId = propertyId;
    }
    if (status) where.status = status;

    const tasks = await prisma.maintenanceTask.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch {
    return unauthorizedResponse();
  }
}

// POST /api/inventory/maintenance
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const { title, description, propertyId, priority, dueDate, assignee, itemId } = body;

    if (!title || !propertyId) {
      return NextResponse.json({ error: "title and propertyId required" }, { status: 400 });
    }

    if (!(await verifyPropertyOwnership(propertyId, userId))) {
      return forbiddenResponse();
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
  } catch {
    return unauthorizedResponse();
  }
}
