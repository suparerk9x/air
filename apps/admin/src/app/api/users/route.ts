import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/users — list all users with stats
export async function GET() {
  try {
    await getAdminUser();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch {
    return unauthorizedResponse();
  }
}

// POST /api/users — create a new user
export async function POST(req: NextRequest) {
  try {
    await getAdminUser();

    const body = await req.json();
    const { email, name, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role: role || "COHOST",
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return unauthorizedResponse();
  }
}
