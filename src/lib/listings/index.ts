import type { AggregatedEvent, BrokerOffer, TicketListing } from "@/lib/types";
import { scoreCrossBroker } from "@/lib/dealScore";
import type { ListingSource } from "./source";
import { ticketsdataSource } from "./ticketsdata";

/**
 * Registered listing sources. TicketsData ships first; add an authorized
 * partner/affiliate feed here and it merges in (or, once you remove TicketsData,
 * fully replaces it). Order doesn't matter — results are merged by broker.
 */
export const LISTING_SOURCES: ListingSource[] = [ticketsdataSource];

export function liveListingSourceIds(): string[] {
  return LISTING_SOURCES.filter((s) => s.isLive()).map((s) => s.id);
}

/**
 * Enrich an event with seat-level listings + real cross-broker prices from every
 * configured source. Source data supersedes the Discovery price range for any
 * broker it covers; the deal score is recomputed from the real spread. Detail
 * view only (sources may consume credits). Strict no-op when nothing is live.
 */
export async function enrichWithListings(
  agg: AggregatedEvent,
): Promise<AggregatedEvent> {
  const live = LISTING_SOURCES.filter((s) => s.isLive());
  if (!live.length) return agg;

  const settled = await Promise.allSettled(live.map((s) => s.getListings(agg)));
  const results = settled
    .filter((s): s is PromiseFulfilledResult<Awaited<ReturnType<ListingSource["getListings"]>>> => s.status === "fulfilled")
    .map((s) => s.value);

  const listings: TicketListing[] = results.flatMap((r) => r.listings);
  const quotaRemaining = results.reduce<number | null>(
    (min, r) =>
      r.quotaRemaining == null ? min : min == null ? r.quotaRemaining : Math.min(min, r.quotaRemaining),
    null,
  );
  if (!listings.length) return { ...agg, quotaRemaining: quotaRemaining ?? agg.quotaRemaining };

  // Merge source offers over the existing ones (first-party seat-level data wins).
  const offerMap = new Map<string, BrokerOffer>(agg.offers.map((o) => [o.brokerId, o]));
  for (const r of results) {
    for (const o of r.offers) {
      if (o.getInPrice == null) continue;
      const existing = offerMap.get(o.brokerId);
      offerMap.set(o.brokerId, { ...o, maxPrice: o.maxPrice ?? existing?.maxPrice ?? null });
    }
  }

  const offers = Array.from(offerMap.values());
  const priced = offers
    .filter((o) => o.getInPrice != null)
    .sort((a, b) => (a.getInPrice as number) - (b.getInPrice as number));
  const bestOffer = priced[0] ?? agg.bestOffer;
  const minPrice = bestOffer?.getInPrice ?? agg.minPrice;
  const maxBroker = priced.length ? (priced[priced.length - 1].getInPrice as number) : null;
  const savings =
    priced.length > 1 && minPrice != null && maxBroker != null
      ? Math.round(maxBroker - minPrice)
      : agg.savings;
  const cross = scoreCrossBroker(offers);

  return {
    ...agg,
    offers,
    bestOffer,
    minPrice,
    savings,
    brokerCount: priced.length,
    dealScore: cross?.score ?? agg.dealScore,
    dealLabel: cross?.label ?? agg.dealLabel,
    dealReason: cross?.reason ?? agg.dealReason,
    liveListings: listings,
    quotaRemaining,
  };
}
