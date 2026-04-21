import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthUserId,
  getUserPropertyIds,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

async function verifyTaskOwnership(taskId: string, userId: string) {
  const userPropertyIds = await getUserPropertyIds(userId);
  const task = await prisma.maintenanceTask.findFirst({
    where: { id: taskId, propertyId: { in: userPropertyIds } },
  });
  return !!task;
}

// PATCH /api/inventory/maintenance/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    if (!(await verifyTaskOwnership(id, userId))) {
      return forbiddenResponse();
    }

    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.assignee !== undefined) data.assignee = body.assignee;
    if (body.cost !== undefined) data.cost = body.cost;
    if (body.status === "COMPLETED") data.completedAt = new Date();

    const task = await prisma.maintenanceTask.update({
      where: { id },
      data,
    });

    return NextResponse.json(task);
  } catch {
    return unauthorizedResponse();
  }
}

// DELETE /api/inventory/maintenance/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    if (!(await verifyTaskOwnership(id, userId))) {
      return forbiddenResponse();
    }

    await prisma.maintenanceTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
