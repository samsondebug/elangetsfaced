import type {
  AggregatedEvent,
  EventCategory,
  EventInfo,
  SortKey,
} from "@/lib/types";
import { fetchOffers } from "@/lib/brokers";
import {
  median,
  scoreCategoryRelative,
  scoreCrossBroker,
} from "@/lib/dealScore";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  sports: "sports",
  music: "concert",
  "arts-theater": "theater",
  comedy: "comedy",
  film: "film",
  other: "event",
};

/** Combine each event with its broker offers (network fan-out, in parallel). */
async function withOffers(events: EventInfo[]) {
  return Promise.all(
    events.map(async (event) => {
      const offers = await fetchOffers(event);
      const priced = offers.filter((o) => o.getInPrice != null);
      const sorted = [...priced].sort(
        (a, b) => (a.getInPrice as number) - (b.getInPrice as number),
      );
      const bestOffer = sorted[0] ?? null;
      const minPrice = bestOffer?.getInPrice ?? null;
      const maxBrokerPrice = sorted.length
        ? (sorted[sorted.length - 1].getInPrice as number)
        : null;
      const savings =
        sorted.length > 1 && minPrice != null && maxBrokerPrice != null
          ? Math.round(maxBrokerPrice - minPrice)
          : null;
      return { event, offers, bestOffer, minPrice, savings, priced };
    }),
  );
}

/**
 * Build the aggregated, deal-scored view for a set of events. Scoring uses the
 * real cross-broker spread when ≥2 brokers are live, otherwise a category-
 * relative "fair price" signal computed from the real price ranges in this set.
 */
export async function aggregateEvents(
  events: EventInfo[],
): Promise<AggregatedEvent[]> {
  const base = await withOffers(events);

  // Category medians (of the cheapest available price) across the loaded set.
  const byCategory = new Map<EventCategory, number[]>();
  for (const b of base) {
    if (b.minPrice != null) {
      const arr = byCategory.get(b.event.category) ?? [];
      arr.push(b.minPrice);
      byCategory.set(b.event.category, arr);
    }
  }
  const categoryMedian = new Map<EventCategory, number>();
  for (const [cat, prices] of byCategory) categoryMedian.set(cat, median(prices));

  return base.map((b): AggregatedEvent => {
    let dealScore: number | null = null;
    let dealLabel: AggregatedEvent["dealLabel"] = null;
    let dealReason: string | null = null;

    const cross = scoreCrossBroker(b.offers);
    if (cross) {
      dealScore = cross.score;
      dealLabel = cross.label;
      dealReason = cross.reason;
    } else if (b.minPrice != null) {
      const catMed = categoryMedian.get(b.event.category) ?? 0;
      const r = scoreCategoryRelative(
        b.minPrice,
        catMed,
        CATEGORY_LABELS[b.event.category],
      );
      dealScore = r.score;
      dealLabel = r.label;
      dealReason = r.reason;
    }

    return {
      event: b.event,
      offers: b.offers,
      bestOffer: b.bestOffer,
      minPrice: b.minPrice,
      brokerCount: b.priced.length,
      savings: b.savings,
      dealScore,
      dealLabel,
      dealReason,
    };
  });
}

/** Apply price ceiling + sorting client-side (Discovery can't filter on price). */
export function refine(
  events: AggregatedEvent[],
  opts: { maxPrice?: number | null; sort?: SortKey },
): AggregatedEvent[] {
  let out = events;
  if (opts.maxPrice != null) {
    out = out.filter((e) => e.minPrice != null && e.minPrice <= opts.maxPrice!);
  }
  const sort = opts.sort ?? "date";
  const priceOf = (e: AggregatedEvent) => e.minPrice ?? Number.POSITIVE_INFINITY;
  const dateOf = (e: AggregatedEvent) =>
    e.event.datetime ? new Date(e.event.datetime).getTime() : Number.POSITIVE_INFINITY;

  const sorted = [...out];
  switch (sort) {
    case "deal":
      sorted.sort((a, b) => (b.dealScore ?? -1) - (a.dealScore ?? -1));
      break;
    case "price-asc":
      sorted.sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "date":
    default:
      sorted.sort((a, b) => dateOf(a) - dateOf(b));
  }
  return sorted;
}
