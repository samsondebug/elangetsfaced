import type { BrokerId, BrokerOffer, EventInfo } from "@/lib/types";
import type { OfferProvider } from "./provider";
import { ticketmasterProvider } from "./ticketmaster";
import { seatgeekProvider } from "./seatgeek";

/** Every registered broker price source. Add new marketplaces here. */
export const PROVIDERS: OfferProvider[] = [ticketmasterProvider, seatgeekProvider];

/**
 * Gather every broker's offer for an event in parallel. Providers that error or
 * have no inventory are simply dropped — one broker never breaks the page.
 */
export async function fetchOffers(event: EventInfo): Promise<BrokerOffer[]> {
  const live = PROVIDERS.filter((p) => p.isLive());
  const results = await Promise.allSettled(live.map((p) => p.getOffer(event)));
  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((o): o is BrokerOffer => o != null);
}

export function liveBrokerIds(): BrokerId[] {
  return PROVIDERS.filter((p) => p.isLive()).map((p) => p.id);
}
