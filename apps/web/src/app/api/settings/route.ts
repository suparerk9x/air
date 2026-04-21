import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "web_menu_config" },
  });

  const config = setting
    ? JSON.parse(setting.value)
    : { dashboard: true, inventory: true, calendarSync: true };

  return NextResponse.json(config);
}
