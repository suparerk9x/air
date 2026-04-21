import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth";
import bcrypt from "bcryptjs";

// PUT /api/users/:id — update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    const { id } = await params;
    const body = await req.json();
    const { email, name, role, password } = body;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent demoting yourself
    if (id === admin.userId && role && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (email !== undefined) data.email = email;
    if (name !== undefined) data.name = name || null;
    if (role !== undefined) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(updated);
  } catch {
    return unauthorizedResponse();
  }
}

// DELETE /api/users/:id — delete user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    const { id } = await params;

    if (id === admin.userId) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return unauthorizedResponse();
  }
}
