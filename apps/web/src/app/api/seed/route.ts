import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/seed - create demo data for development
export async function POST() {
  const hashedPassword = await bcrypt.hash("demo123", 10);

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@air.local" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      email: "demo@air.local",
      name: "Demo Host",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create demo properties
  const prop1 = await prisma.property.upsert({
    where: { id: "demo-prop-1" },
    update: {},
    create: {
      id: "demo-prop-1",
      name: "Sukhumvit Studio",
      address: "123 Sukhumvit Soi 24, Bangkok",
      color: "#3b82f6",
      platform: "airbnb",
      userId: user.id,
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { id: "demo-prop-2" },
    update: {},
    create: {
      id: "demo-prop-2",
      name: "Silom Condo 1BR",
      address: "456 Silom Road, Bangkok",
      color: "#10b981",
      platform: "airbnb",
      userId: user.id,
    },
  });

  const prop3 = await prisma.property.upsert({
    where: { id: "demo-prop-3" },
    update: {},
    create: {
      id: "demo-prop-3",
      name: "Hua Hin Beachfront",
      address: "789 Beach Road, Hua Hin",
      color: "#f59e0b",
      platform: "booking",
      userId: user.id,
    },
  });

  // Create sample bookings
  const now = new Date();
  const bookings = [
    {
      summary: "John Smith",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      status: "CHECKEDOUT" as const,
      source: "ical",
      propertyId: prop1.id,
    },
    {
      summary: "Maria Garcia",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      status: "CHECKEDIN" as const,
      source: "ical",
      propertyId: prop1.id,
    },
    {
      summary: "Tanaka Yuki",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8),
      status: "CONFIRMED" as const,
      source: "ical",
      propertyId: prop1.id,
    },
    {
      summary: "David Lee",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
      status: "CHECKEDIN" as const,
      source: "manual",
      propertyId: prop2.id,
    },
    {
      summary: "Sophie Chen",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
      status: "CONFIRMED" as const,
      source: "ical",
      propertyId: prop2.id,
    },
    {
      summary: "Blocked",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      status: "BLOCKED" as const,
      source: "manual",
      propertyId: prop3.id,
    },
    {
      summary: "Robert Wilson",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
      status: "CONFIRMED" as const,
      source: "ical",
      propertyId: prop3.id,
    },
  ];

  await prisma.booking.deleteMany({
    where: {
      propertyId: { in: [prop1.id, prop2.id, prop3.id] },
    },
  });

  for (const booking of bookings) {
    await prisma.booking.create({ data: booking });
  }

  return NextResponse.json({
    success: true,
    user: user.id,
    properties: [prop1.id, prop2.id, prop3.id],
    bookings: bookings.length,
    credentials: { email: "demo@air.local", password: "demo123" },
  });
}
