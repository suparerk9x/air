import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/inventory/maintenance/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
}

// DELETE /api/inventory/maintenance/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.maintenanceTask.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
