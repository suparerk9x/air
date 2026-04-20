import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchICalEvents } from "@/lib/ical";
import {
  getAuthUserId,
  verifyPropertyOwnership,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/auth-api";

// POST /api/properties/:id/sync - sync iCal bookings
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

    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (!property.icalUrl) {
      return NextResponse.json(
        { error: "No iCal URL configured" },
        { status: 400 }
      );
    }

    const events = await fetchICalEvents(property.icalUrl);
    let created = 0;
    let updated = 0;

    for (const event of events) {
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
          },
        });
        updated++;
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
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: events.length,
      created,
      updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("iCal sync error:", error);
    return NextResponse.json(
      { error: "Failed to fetch iCal feed" },
      { status: 500 }
    );
  }
}
