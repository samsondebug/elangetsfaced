import type { BrokerOffer, EventInfo } from "@/lib/types";

/**
 * The contract every broker price source implements. Given a normalized event
 * (discovered via Ticketmaster), a provider returns that broker's best offer so
 * SeatScout can compare prices across marketplaces. Returning null means "this
 * broker has nothing for this event" — never fabricated data.
 *
 * Add a marketplace by implementing this and registering it in index.ts.
 */
export interface OfferProvider {
  id: BrokerOffer["brokerId"];
  /** True when real credentials are configured. */
  isLive(): boolean;
  getOffer(event: EventInfo): Promise<BrokerOffer | null>;
}
