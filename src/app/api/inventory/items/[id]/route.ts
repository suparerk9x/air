import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/inventory/items/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(item);
}

// DELETE /api/inventory/items/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
