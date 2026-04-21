import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  try {
    await getAdminUser();

    // DB health check
    let dbStatus = "ok";
    let dbLatency = 0;
    try {
      const start = Date.now();
      await prisma.$queryRawUnsafe("SELECT 1");
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = "error";
    }

    // Sync status: feeds with errors, last synced times
    const feeds = await prisma.iCalFeed.findMany({
      select: {
        id: true,
        url: true,
        platform: true,
        lastSyncAt: true,
        lastError: true,
        property: {
          select: {
            name: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { lastSyncAt: "desc" },
    });

    const feedsWithErrors = feeds.filter((f) => f.lastError);
    const totalFeeds = feeds.length;
    const syncedFeeds = feeds.filter((f) => f.lastSyncAt).length;

    // User activity: users with most properties
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        _count: { select: { properties: true } },
      },
      orderBy: { properties: { _count: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      db: { status: dbStatus, latencyMs: dbLatency },
      sync: {
        totalFeeds,
        syncedFeeds,
        errorFeeds: feedsWithErrors.map((f) => ({
          id: f.id,
          platform: f.platform,
          property: f.property.name,
          user: f.property.user.email,
          lastError: f.lastError,
          lastSyncAt: f.lastSyncAt,
        })),
      },
      topUsers: topUsers.map((u) => ({
        email: u.email,
        name: u.name,
        properties: u._count.properties,
      })),
    });
  } catch {
    return unauthorizedResponse();
  }
}
