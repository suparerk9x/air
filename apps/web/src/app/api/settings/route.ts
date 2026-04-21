import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CONFIG = [
  { key: "dashboard", visible: true },
  {
    key: "inventory",
    visible: true,
    children: [
      { key: "inventoryCounter", visible: true },
      { key: "inventoryItems", visible: true },
    ],
  },
  { key: "calendarSync", visible: true },
];

export async function GET() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "web_menu_config" },
  });

  if (!setting) {
    return NextResponse.json(DEFAULT_CONFIG);
  }

  const parsed = JSON.parse(setting.value);

  // Already new array format
  if (Array.isArray(parsed)) {
    return NextResponse.json(parsed);
  }

  // Legacy boolean format — convert to array
  const legacy = parsed as Record<string, boolean>;
  const converted = DEFAULT_CONFIG.map((item) => ({
    ...item,
    visible: legacy[item.key] ?? item.visible,
  }));

  return NextResponse.json(converted);
}
