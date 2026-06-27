import type { AggregatedEvent, BrokerId, BrokerOffer, TicketListing } from "@/lib/types";
import { getBroker } from "@/lib/brokers/registry";
import { EMPTY_RESULT, type ListingResult, type ListingSource } from "./source";

// TEMPLATE: authorized partner / affiliate feed adapter.
//
// This is the legitimate way to REPLACE TicketsData for a broker: once you're
// approved for a marketplace's partner or affiliate program (StubHub via Impact,
// Vivid Seats via Partnerize, Ticketmaster Partner API, etc.), they give you an
// authorized endpoint that returns listings/pricing for an event. Wire it here,
// map their payload to our offer/listing shape, then register this source in
// index.ts. No scraping, no anti-bot infrastructure — authorized data only.
//
// Configure per broker via env:
//   PARTNER_FEED_<BROKER>_URL   e.g. https://api.partner.example/v1/listings?event={externalId}
//   PARTNER_FEED_<BROKER>_KEY   bearer token / API key issued by the program
//
// The {externalId} placeholder is filled from the matched event id for that
// broker (you'll resolve that via the program's event-search endpoint or a
// stored mapping). This file is intentionally NOT registered by default — fill
// in the request + mapping for a real program, then add it to LISTING_SOURCES.

function feedConfig(broker: BrokerId): { url: string; key: string } | null {
  const url = process.env[`PARTNER_FEED_${broker.toUpperCase()}_URL`];
  const key = process.env[`PARTNER_FEED_${broker.toUpperCase()}_KEY`];
  return url && key ? { url, key } : null;
}

/** Build a partner-feed source for a single marketplace. */
export function createPartnerFeedSource(broker: BrokerId): ListingSource {
  return {
    id: `partner-feed:${broker}`,

    isLive() {
      return feedConfig(broker) != null;
    },

    async getListings(agg: AggregatedEvent): Promise<ListingResult> {
      const cfg = feedConfig(broker);
      if (!cfg) return EMPTY_RESULT;
      try {
        // Resolve the broker's event id for this event. In a real integration
        // this comes from the program's event-search endpoint (by name + date +
        // venue) or a stored mapping table. Until that's wired, bail safely.
        const externalId = await resolveExternalEventId(broker, agg);
        if (!externalId) return EMPTY_RESULT;

        const url = cfg.url.replace("{externalId}", encodeURIComponent(externalId));
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${cfg.key}` },
          next: { revalidate: 60 },
        });
        if (!res.ok) return EMPTY_RESULT;
        const data = (await res.json()) as { listings?: unknown[] };

        const listings: TicketListing[] = (data.listings ?? [])
          .map((raw) => mapListing(raw, broker))
          .filter((l): l is TicketListing => l != null);
        if (!listings.length) return EMPTY_RESULT;

        const getInPrice = Math.min(...listings.map((l) => l.price));
        const offer: BrokerOffer = {
          brokerId: broker,
          brokerName: getBroker(broker).name,
          getInPrice,
          maxPrice: Math.max(...listings.map((l) => l.price)),
          currency: agg.event.currency,
          url: agg.event.url,
          available: true,
          listingCount: listings.length,
        };
        return { offers: [offer], listings };
      } catch {
        return EMPTY_RESULT;
      }
    },
  };
}

/** Map one raw feed row to our listing shape — adjust field names per program. */
function mapListing(raw: unknown, broker: BrokerId): TicketListing | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const price = Number(r.price ?? r.amount ?? r.total);
  if (!Number.isFinite(price)) return null;
  return {
    platform: broker,
    section: String(r.section ?? "—"),
    row: String(r.row ?? "—"),
    quantity: Number(r.quantity ?? r.qty ?? 1) || 1,
    price,
    url: typeof r.url === "string" ? r.url : null,
  };
}

/** Resolve a broker's native event id. Implement per program; stubbed for now. */
async function resolveExternalEventId(
  _broker: BrokerId,
  _agg: AggregatedEvent,
): Promise<string | null> {
  return null;
}
