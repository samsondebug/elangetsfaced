import type { AggregatedEvent, BrokerOffer, TicketListing } from "@/lib/types";

// Pluggable listing-source abstraction.
//
// The detail view's seat-level inventory + cross-broker prices come from one or
// more ListingSources. TicketsData is the first adapter, but it is NOT special:
// an authorized partner/affiliate feed (Ticketmaster Partner API, StubHub via
// Impact, Vivid via Partnerize, etc.) implements this same interface and slots
// in — or fully replaces TicketsData — with no changes to the routes or UI.
//
// This is the seam that lets you swap the aggregator for first-party data.

export interface ListingResult {
  /** Per-broker offers (get-in prices) derived from this source. */
  offers: BrokerOffer[];
  /** Seat-level listings surfaced by this source. */
  listings: TicketListing[];
  /** Optional remaining-credit / rate signal for display. */
  quotaRemaining?: number | null;
}

export interface ListingSource {
  id: string;
  /** True when this source is configured (credentials / feed URL present). */
  isLive(): boolean;
  /** Return offers + listings for an event. Must never throw — return empty. */
  getListings(event: AggregatedEvent): Promise<ListingResult>;
}

export const EMPTY_RESULT: ListingResult = { offers: [], listings: [] };
