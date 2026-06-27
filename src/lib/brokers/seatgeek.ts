import type { BrokerOffer, EventInfo } from "@/lib/types";
import type { OfferProvider } from "./provider";

// SeatGeek offer provider (real). Goes live the moment SEATGEEK_CLIENT_ID is
// set. SeatGeek's public Platform API exposes per-event price stats
// (lowest_price is all-in / fee-inclusive), which is exactly what we need for an
// honest cross-broker get-in comparison.
//
// Docs: https://platform.seatgeek.com/

interface SgEvent {
  id: number;
  title: string;
  datetime_utc?: string;
  url?: string;
  stats?: {
    lowest_price?: number | null;
    highest_price?: number | null;
    listing_count?: number | null;
  };
}

function clientId(): string | undefined {
  return process.env.SEATGEEK_CLIENT_ID;
}

/** Hours between two ISO datetimes (Infinity if either is missing). */
function hoursApart(a: string | null, b?: string): number {
  if (!a || !b) return Infinity;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 3_600_000;
}

export const seatgeekProvider: OfferProvider = {
  id: "seatgeek",

  isLive() {
    return Boolean(clientId());
  },

  async getOffer(event: EventInfo): Promise<BrokerOffer | null> {
    const id = clientId();
    if (!id) return null;
    try {
      const url = new URL("https://api.seatgeek.com/2/events");
      url.searchParams.set("client_id", id);
      if (process.env.SEATGEEK_CLIENT_SECRET) {
        url.searchParams.set("client_secret", process.env.SEATGEEK_CLIENT_SECRET);
      }
      url.searchParams.set("q", event.name);
      url.searchParams.set("per_page", "10");
      const res = await fetch(url, { next: { revalidate: 120 } });
      if (!res.ok) return null;
      const data = (await res.json()) as { events?: SgEvent[] };
      const candidates = data.events ?? [];
      if (!candidates.length) return null;

      // Prefer the candidate closest in time to the Ticketmaster event (within a
      // day); otherwise fall back to the first with usable price stats.
      const dated = candidates
        .map((c) => ({ c, dh: hoursApart(event.datetime, c.datetime_utc) }))
        .sort((a, b) => a.dh - b.dh);
      const match =
        dated.find((d) => d.dh <= 24 && d.c.stats?.lowest_price)?.c ??
        candidates.find((c) => c.stats?.lowest_price);
      if (!match?.stats?.lowest_price) return null;

      return {
        brokerId: "seatgeek",
        brokerName: "SeatGeek",
        getInPrice: match.stats.lowest_price,
        maxPrice: match.stats.highest_price ?? null,
        currency: "USD",
        url: match.url ?? `https://seatgeek.com/e/${match.id}`,
        available: true,
        listingCount: match.stats.listing_count ?? null,
      };
    } catch {
      return null;
    }
  },
};
