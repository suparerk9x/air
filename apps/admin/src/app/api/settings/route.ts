import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  try {
    await getAdminUser();

    const settings = await prisma.appSetting.findMany();
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      result[s.key] = JSON.parse(s.value);
    }

    return NextResponse.json(result);
  } catch {
    return unauthorizedResponse();
  }
}

export async function PUT(req: Request) {
  try {
    await getAdminUser();

    const { key, value } = await req.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });

    return NextResponse.json({ key: setting.key, value: JSON.parse(setting.value) });
  } catch {
    return unauthorizedResponse();
  }
}
