import type { AggregatedEvent, BrokerId } from "@/lib/types";

// Affiliate deep-link layer.
//
// Every outbound "Buy" link is routed through this so SeatScout earns commission
// on referred sales — the legitimate consumer-app business model (data via
// official APIs / authorized aggregator, revenue via each marketplace's
// affiliate program: Impact, Partnerize, CJ, etc.).
//
// Each broker's link format is configured via an env var so no program details
// are hardcoded. Two template styles are supported:
//   • Placeholder:  https://goto.network/c/PUB/CAMP?u={url}   ({url} = encoded dest)
//   • Query params: ?utm_source=seatscout&sid=abc            (merged onto the dest)
// With nothing configured this is a strict no-op — raw broker URLs pass through.

const ENV_KEYS: Record<BrokerId, string> = {
  ticketmaster: "AFFILIATE_TICKETMASTER",
  seatgeek: "AFFILIATE_SEATGEEK",
  stubhub: "AFFILIATE_STUBHUB",
  vividseats: "AFFILIATE_VIVIDSEATS",
  tickpick: "AFFILIATE_TICKPICK",
  viagogo: "AFFILIATE_VIAGOGO",
  gametime: "AFFILIATE_GAMETIME",
  dice: "AFFILIATE_DICE",
  eventbrite: "AFFILIATE_EVENTBRITE",
  axs: "AFFILIATE_AXS",
};

export function affiliateUrl(brokerId: BrokerId, rawUrl: string): string {
  const tmpl = process.env[ENV_KEYS[brokerId]];
  if (!tmpl || !rawUrl) return rawUrl;

  if (tmpl.includes("{url}")) {
    return tmpl.replace("{url}", encodeURIComponent(rawUrl));
  }
  if (tmpl.includes("{rawurl}")) {
    return tmpl.replace("{rawurl}", rawUrl);
  }
  // Otherwise treat the template as query params to merge onto the destination.
  try {
    const u = new URL(rawUrl);
    const extra = new URLSearchParams(tmpl.replace(/^[?&]/, ""));
    extra.forEach((v, k) => u.searchParams.set(k, v));
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/** True when at least one broker has an affiliate template configured. */
export function affiliateEnabled(): boolean {
  return Object.values(ENV_KEYS).some((k) => Boolean(process.env[k]));
}

/** Rewrite every user-facing buy link in an aggregated event to its affiliate
 *  form. Internal URLs (event.url, used for upstream fetches) are left intact. */
export function withAffiliateLinks(agg: AggregatedEvent): AggregatedEvent {
  const offers = agg.offers.map((o) => ({
    ...o,
    url: affiliateUrl(o.brokerId, o.url),
  }));
  const bestOffer = agg.bestOffer
    ? { ...agg.bestOffer, url: affiliateUrl(agg.bestOffer.brokerId, agg.bestOffer.url) }
    : null;
  const liveListings = agg.liveListings?.map((l) => ({
    ...l,
    url: l.url ? affiliateUrl(l.platform, l.url) : l.url,
  }));
  return { ...agg, offers, bestOffer, liveListings };
}
