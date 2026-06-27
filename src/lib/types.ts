// Core domain model for SeatScout.
//
// Everything is derived from REAL upstream data. The primary source is the
// Ticketmaster Discovery API, which returns events + price RANGES (not seat-by-
// seat resale inventory). Additional brokers (SeatGeek, etc.) contribute their
// own price "offers" for the same event, which is what powers cross-broker
// comparison. There is no synthetic/mock data anywhere in this model.

export type BrokerId = "ticketmaster" | "seatgeek";

export type EventCategory =
  | "sports"
  | "music"
  | "arts-theater"
  | "comedy"
  | "film"
  | "other";

export interface Broker {
  id: BrokerId;
  name: string;
  short: string;
  color: string;
  /** Marketplaces that show fees up front in their quoted price. */
  allInPricing: boolean;
}

export interface Venue {
  name: string;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lon: number | null;
}

/** A normalized event sourced from a discovery provider (Ticketmaster). */
export interface EventInfo {
  id: string;
  name: string;
  category: EventCategory;
  /** Ticketmaster genre / subGenre for finer filtering (e.g. "Basketball"). */
  genre: string | null;
  subGenre: string | null;
  /** ISO datetime; null when Ticketmaster lists the date as TBD. */
  datetime: string | null;
  /** Local date string (yyyy-mm-dd) as provided upstream, for display. */
  dateLocal: string | null;
  timeTbd: boolean;
  venue: Venue | null;
  performers: string[];
  imageUrl: string | null;
  /** Official purchase URL on the source marketplace. */
  url: string;
  currency: string;
  /** Lowest / highest face price from the source's price range (may be null). */
  priceMin: number | null;
  priceMax: number | null;
  onSaleStart: string | null;
  onSaleEnd: string | null;
  /** Which discovery provider surfaced this event. */
  source: BrokerId;
}

/** One broker's price offer for an event — the unit of cross-broker comparison. */
export interface BrokerOffer {
  brokerId: BrokerId;
  brokerName: string;
  /** Lowest available price ("get-in") for this broker, or null if unknown. */
  getInPrice: number | null;
  maxPrice: number | null;
  currency: string;
  /** Deep link to buy on that broker. */
  url: string;
  /** Whether the broker reported live availability. */
  available: boolean;
  /** Optional count of listings the broker reports. */
  listingCount?: number | null;
}

export type DealLabel = "great" | "good" | "fair" | "high";

/** An event plus every broker's offer plus computed deal signals. */
export interface AggregatedEvent {
  event: EventInfo;
  offers: BrokerOffer[];
  /** Cheapest offer across brokers (by get-in price). */
  bestOffer: BrokerOffer | null;
  minPrice: number | null;
  /** Number of brokers reporting availability. */
  brokerCount: number;
  /** $ saved buying the cheapest broker vs the priciest (when >1 broker). */
  savings: number | null;
  /** 0-100 value signal. Cross-broker spread when >1 broker, else a category-
   *  relative "fair price" score derived from real Ticketmaster price ranges. */
  dealScore: number | null;
  dealLabel: DealLabel | null;
  /** Plain-language explanation of how the score was derived (no black box). */
  dealReason: string | null;
}

export type SortKey = "deal" | "price-asc" | "price-desc" | "date";

export interface SearchFilters {
  query: string;
  category: EventCategory | "all";
  city: string;
  dateFrom: string | null;
  dateTo: string | null;
  maxPrice: number | null;
  sort: SortKey;
}

export interface PriceAlert {
  eventId: string;
  eventName: string;
  targetPrice: number;
  currency: string;
  createdAt: string;
}

/** Shape returned by /api/events. */
export interface EventsResponse {
  events: AggregatedEvent[];
  page: number;
  totalPages: number;
  totalElements: number;
  /** Brokers currently pulling live data. */
  liveBrokers: BrokerId[];
  /** Set when something is misconfigured (e.g. missing API key). */
  notice: string | null;
}
