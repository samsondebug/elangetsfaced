import type { AggregatedEvent, TicketListing } from "@/lib/types";
import { fetchListings, ticketsdataEnabled } from "./client";

/**
 * Enrich an aggregated event with real seat-level listings from TicketsData.
 *
 * Today this pulls live inventory for the event's own marketplace (the platform
 * Ticketmaster discovery surfaced) using its canonical event URL, then upgrades
 * that broker's get-in price from the real listings. It is a strict no-op when
 * credentials are absent, and never throws — a TicketsData hiccup must not break
 * the detail page.
 *
 * Expanding to all 10 marketplaces is a matter of resolving each platform's
 * event URL (via TicketsData `/match`) and fetching them here too — the offer
 * model and UI already render any number of brokers.
 */
export async function enrichWithLiveListings(
  agg: AggregatedEvent,
): Promise<AggregatedEvent> {
  if (!ticketsdataEnabled()) return agg;

  try {
    // The discovery source is currently always Ticketmaster.
    const { listings, getInPrice, quotaRemaining } = await fetchListings(
      "ticketmaster",
      agg.event.url,
    );
    if (!listings.length) return { ...agg, quotaRemaining };

    const liveListings: TicketListing[] = listings.map((l) => ({
      platform: "ticketmaster",
      section: l.section,
      row: l.row,
      quantity: l.quantity,
      price: l.price,
      url: l.url,
    }));

    // Upgrade the Ticketmaster offer with the real, seat-level get-in price.
    const offers = agg.offers.map((o) =>
      o.brokerId === "ticketmaster" && getInPrice != null
        ? { ...o, getInPrice, available: true, listingCount: listings.length }
        : o,
    );

    const priced = offers
      .filter((o) => o.getInPrice != null)
      .sort((a, b) => (a.getInPrice as number) - (b.getInPrice as number));
    const bestOffer = priced[0] ?? agg.bestOffer;
    const minPrice = bestOffer?.getInPrice ?? agg.minPrice;

    return {
      ...agg,
      offers,
      bestOffer,
      minPrice,
      liveListings,
      quotaRemaining,
    };
  } catch {
    return agg;
  }
}
