import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchICalEvents } from "@/lib/ical";
import {
  getAuthUserId,
  verifyPropertyOwnership,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// POST /api/properties/:id/sync - sync iCal bookings from all feeds
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    if (!(await verifyPropertyOwnership(id, userId))) {
      return forbiddenResponse();
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: { icalFeeds: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Collect all feed URLs: from ICalFeed table + legacy icalUrl field
    const feedSources: { id: string | null; url: string; label: string }[] = [];

    for (const feed of property.icalFeeds) {
      feedSources.push({ id: feed.id, url: feed.url, label: feed.label || feed.platform });
    }

    // Fallback: legacy single icalUrl (if no feeds configured)
    if (feedSources.length === 0 && property.icalUrl) {
      feedSources.push({ id: null, url: property.icalUrl, label: "legacy" });
    }

    if (feedSources.length === 0) {
      return NextResponse.json(
        { error: "No iCal feeds configured" },
        { status: 400 }
      );
    }

    let totalCreated = 0;
    let totalUpdated = 0;
    const errors: { label: string; error: string }[] = [];

    for (const source of feedSources) {
      try {
        const events = await fetchICalEvents(source.url);

        // Skip "Not available" blocked dates — only sync real reservations
        const reservations = events.filter(
          (e) => !e.summary.includes("Not available")
        );

        for (const event of reservations) {
          const existing = await prisma.booking.findUnique({
            where: {
              propertyId_externalUid: {
                propertyId: id,
                externalUid: event.uid,
              },
            },
          });

          if (existing) {
            await prisma.booking.update({
              where: { id: existing.id },
              data: {
                summary: event.summary,
                startDate: event.start,
                endDate: event.end,
                source: "ical",
                notes: event.reservationUrl || existing.notes,
              },
            });
            totalUpdated++;
          } else {
            await prisma.booking.create({
              data: {
                summary: event.summary,
                startDate: event.start,
                endDate: event.end,
                status: "CONFIRMED",
                source: "ical",
                externalUid: event.uid,
                propertyId: id,
                notes: event.reservationUrl || null,
              },
            });
            totalCreated++;
          }
        }

        // Update lastSyncAt
        if (source.id) {
          await prisma.iCalFeed.update({
            where: { id: source.id },
            data: { lastSyncAt: new Date(), lastError: null },
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push({ label: source.label, error: errorMsg });

        if (source.id) {
          await prisma.iCalFeed.update({
            where: { id: source.id },
            data: { lastError: errorMsg },
          });
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      feeds: feedSources.length,
      created: totalCreated,
      updated: totalUpdated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("iCal sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync iCal feeds" },
      { status: 500 }
    );
  }
}
