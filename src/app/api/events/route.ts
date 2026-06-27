import { NextResponse } from "next/server";
import { aggregateEvents, refine } from "@/lib/aggregate";
import { liveBrokerIds } from "@/lib/brokers";
import {
  searchEvents,
  TicketmasterApiError,
  TicketmasterConfigError,
} from "@/lib/ticketmaster/client";
import type { EventsResponse, SortKey } from "@/lib/types";

export const dynamic = "force-dynamic";

function toStart(d: string | null): string | undefined {
  if (!d) return undefined;
  return d.includes("T") ? d : `${d}T00:00:00Z`;
}
function toEnd(d: string | null): string | undefined {
  if (!d) return undefined;
  return d.includes("T") ? d : `${d}T23:59:59Z`;
}

const VALID_SORTS: SortKey[] = ["deal", "price-asc", "price-desc", "date"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "all";
  const city = searchParams.get("city") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const maxPriceRaw = searchParams.get("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : null;
  const sortRaw = (searchParams.get("sort") ?? "date") as SortKey;
  const sort: SortKey = VALID_SORTS.includes(sortRaw) ? sortRaw : "date";
  const page = Number(searchParams.get("page") ?? "0") || 0;

  // Ticketmaster's API can't sort by aggregated price; ask it for date order and
  // we re-sort after aggregation.
  const tmSort = sort === "deal" ? "relevance,desc" : "date,asc";

  try {
    const result = await searchEvents({
      keyword: q || undefined,
      category: category === "all" ? undefined : category,
      city: city || undefined,
      startDateTime: toStart(dateFrom),
      endDateTime: toEnd(dateTo),
      sort: tmSort,
      page,
      size: 50,
    });

    const aggregated = await aggregateEvents(result.events);
    const events = refine(aggregated, { maxPrice, sort });

    const body: EventsResponse = {
      events,
      page: result.page,
      totalPages: result.totalPages,
      totalElements: result.totalElements,
      liveBrokers: liveBrokerIds(),
      notice: null,
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof TicketmasterConfigError) {
      return NextResponse.json<EventsResponse>(
        {
          events: [],
          page: 0,
          totalPages: 0,
          totalElements: 0,
          liveBrokers: [],
          notice: err.message,
        },
        { status: 200 },
      );
    }
    const message =
      err instanceof TicketmasterApiError
        ? `Ticketmaster API error (${err.status}). Check your key and try again.`
        : "Couldn't reach Ticketmaster. If you're running inside a restricted network, allow app.ticketmaster.com.";
    return NextResponse.json<EventsResponse>(
      {
        events: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        liveBrokers: [],
        notice: message,
      },
      { status: 200 },
    );
  }
}
