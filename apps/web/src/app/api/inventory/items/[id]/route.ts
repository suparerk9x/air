import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorizedResponse } from "@/lib/auth-api";

// PUT /api/inventory/items/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthUserId();
    const { id } = await params;
    const body = await req.json();

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(item);
  } catch {
    return unauthorizedResponse();
  }
}

// DELETE /api/inventory/items/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthUserId();
    const { id } = await params;
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
