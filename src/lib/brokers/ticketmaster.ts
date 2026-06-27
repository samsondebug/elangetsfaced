import type { BrokerOffer, EventInfo } from "@/lib/types";
import { ticketmasterEnabled } from "@/lib/ticketmaster/client";
import type { OfferProvider } from "./provider";

// Ticketmaster offer provider. Because events are discovered THROUGH
// Ticketmaster, its offer is simply the price range already attached to the
// event — no extra network call needed.
export const ticketmasterProvider: OfferProvider = {
  id: "ticketmaster",

  isLive() {
    return ticketmasterEnabled();
  },

  async getOffer(event: EventInfo): Promise<BrokerOffer | null> {
    return {
      brokerId: "ticketmaster",
      brokerName: "Ticketmaster",
      getInPrice: event.priceMin,
      maxPrice: event.priceMax,
      currency: event.currency,
      url: event.url,
      available: event.priceMin != null,
    };
  },
};
