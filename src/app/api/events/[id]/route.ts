import { NextResponse } from "next/server";
import { aggregateEvents } from "@/lib/aggregate";
import {
  getEvent,
  TicketmasterApiError,
  TicketmasterConfigError,
} from "@/lib/ticketmaster/client";
import { enrichWithLiveListings } from "@/lib/ticketsdata/enrich";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const event = await getEvent(params.id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const [aggregated] = await aggregateEvents([event]);
    // Upgrade the detail view with real seat-level inventory when TicketsData
    // credentials are configured (no-op otherwise).
    const enriched = await enrichWithLiveListings(aggregated);
    return NextResponse.json(enriched);
  } catch (err) {
    if (err instanceof TicketmasterConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const status = err instanceof TicketmasterApiError ? err.status : 502;
    return NextResponse.json(
      { error: "Failed to load event from Ticketmaster." },
      { status },
    );
  }
}
