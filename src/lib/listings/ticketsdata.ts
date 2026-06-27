import type { AggregatedEvent, BrokerOffer, TicketListing } from "@/lib/types";
import { getBroker } from "@/lib/brokers/registry";
import {
  fetchListings,
  matchEvent,
  ticketsdataEnabled,
  type TdPlatform,
} from "@/lib/ticketsdata/client";
import { EMPTY_RESULT, type ListingResult, type ListingSource } from "./source";

// Cap fetches per view to bound credit spend.
const MAX_FETCHES = 10;

/**
 * TicketsData as a ListingSource. This is one interchangeable implementation —
 * replacing it with an authorized partner/affiliate feed is just another file
 * implementing the same interface and registering in index.ts.
 */
export const ticketsdataSource: ListingSource = {
  id: "ticketsdata",

  isLive() {
    return ticketsdataEnabled();
  },

  async getListings(agg: AggregatedEvent): Promise<ListingResult> {
    try {
      const targets: { platform: TdPlatform; url: string }[] = [
        { platform: "ticketmaster", url: agg.event.url },
      ];
      const matches = await matchEvent({
        name: agg.event.name,
        date: agg.event.dateLocal,
        eventUrl: agg.event.url,
      });
      for (const m of matches) {
        if (m.platform === "ticketmaster") continue;
        if (targets.some((t) => t.platform === m.platform)) continue;
        targets.push({ platform: m.platform, url: m.eventUrl });
      }

      const settled = await Promise.allSettled(
        targets.slice(0, MAX_FETCHES).map((t) =>
          fetchListings(t.platform, t.url).then((r) => ({ ...r, platform: t.platform, url: t.url })),
        ),
      );
      const fetched = settled
        .filter((s): s is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchListings>> & { platform: TdPlatform; url: string }> => s.status === "fulfilled")
        .map((s) => s.value);

      const listings: TicketListing[] = fetched.flatMap((f) =>
        f.listings.map((l) => ({
          platform: f.platform,
          section: l.section,
          row: l.row,
          quantity: l.quantity,
          price: l.price,
          url: l.url,
        })),
      );
      const quotaRemaining = fetched.reduce<number | null>(
        (min, f) =>
          f.quotaRemaining == null ? min : min == null ? f.quotaRemaining : Math.min(min, f.quotaRemaining),
        null,
      );

      const offers: BrokerOffer[] = fetched
        .filter((f) => f.getInPrice != null)
        .map((f) => ({
          brokerId: f.platform,
          brokerName: getBroker(f.platform).name,
          getInPrice: f.getInPrice,
          maxPrice: null,
          currency: agg.event.currency,
          url: f.url ?? agg.event.url,
          available: true,
          listingCount: f.listings.length,
        }));

      return { offers, listings, quotaRemaining };
    } catch {
      return EMPTY_RESULT;
    }
  },
};
