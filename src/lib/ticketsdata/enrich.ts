import type { AggregatedEvent, BrokerOffer, TicketListing } from "@/lib/types";
import { getBroker } from "@/lib/brokers/registry";
import { scoreCrossBroker } from "@/lib/dealScore";
import {
  fetchListings,
  matchEvent,
  ticketsdataEnabled,
  type TdPlatform,
} from "./client";

// Cap how many marketplaces we fetch per detail view — each /fetch spends a
// credit, so this bounds the cost of a single page load.
const MAX_FETCHES = 10;

/**
 * Enrich an aggregated event with real seat-level listings + cross-broker
 * pricing from TicketsData.
 *
 * Flow: resolve the same event across marketplaces via `/match`, then pull live
 * inventory from each via `/fetch`, merge everything into the offer set, and
 * recompute the deal score from the *real* cross-broker spread. Strict no-op
 * without credentials; never throws (a TicketsData hiccup must not break the
 * page). Runs only on the detail view to conserve credits — the grid stays on
 * the free Ticketmaster/SeatGeek feeds.
 */
export async function enrichWithLiveListings(
  agg: AggregatedEvent,
): Promise<AggregatedEvent> {
  if (!ticketsdataEnabled()) return agg;

  try {
    // Always pull the event's own marketplace (Ticketmaster) for real seats…
    const targets: { platform: TdPlatform; url: string }[] = [
      { platform: "ticketmaster", url: agg.event.url },
    ];
    // …then find it on the other marketplaces.
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

    const liveListings: TicketListing[] = fetched.flatMap((f) =>
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
    if (!liveListings.length) return { ...agg, quotaRemaining };

    // Merge real get-in prices into the offer set (TicketsData seat-level data
    // supersedes the Discovery price range for any platform it covers).
    const offerMap = new Map<string, BrokerOffer>(
      agg.offers.map((o) => [o.brokerId, o]),
    );
    for (const f of fetched) {
      if (f.getInPrice == null) continue;
      const broker = getBroker(f.platform);
      const existing = offerMap.get(f.platform);
      offerMap.set(f.platform, {
        brokerId: f.platform,
        brokerName: broker.name,
        getInPrice: f.getInPrice,
        maxPrice: existing?.maxPrice ?? null,
        currency: agg.event.currency,
        url: f.url ?? existing?.url ?? agg.event.url,
        available: true,
        listingCount: f.listings.length,
      });
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

    // With multiple real brokers we can now compute the true cross-broker score.
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
      liveListings,
      quotaRemaining,
    };
  } catch {
    return agg;
  }
}
