import type { EventCategory, EventInfo } from "@/lib/types";

// Real Ticketmaster Discovery API v2 client.
// Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
//
// Requires a free Consumer Key in TICKETMASTER_API_KEY. No mock data: when the
// key is absent the client throws a typed error the API layer turns into a clear
// "configure your key" notice for the UI.

const BASE = "https://app.ticketmaster.com/discovery/v2";

export class TicketmasterConfigError extends Error {}
export class TicketmasterApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function ticketmasterEnabled(): boolean {
  return Boolean(process.env.TICKETMASTER_API_KEY);
}

function apiKey(): string {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) {
    throw new TicketmasterConfigError(
      "TICKETMASTER_API_KEY is not set. Get a free Consumer Key at developer.ticketmaster.com and add it to your environment.",
    );
  }
  return key;
}

// ---- Raw API response shapes (only the fields we use) ----

interface TmImage {
  url: string;
  width: number;
  height: number;
  ratio?: string;
  fallback?: boolean;
}

interface TmPriceRange {
  type?: string;
  currency?: string;
  min?: number;
  max?: number;
}

interface TmClassification {
  primary?: boolean;
  segment?: { name?: string };
  genre?: { name?: string };
  subGenre?: { name?: string };
}

interface TmVenue {
  name?: string;
  city?: { name?: string };
  state?: { name?: string; stateCode?: string };
  country?: { name?: string; countryCode?: string };
  location?: { latitude?: string; longitude?: string };
}

interface TmEvent {
  id: string;
  name: string;
  url: string;
  images?: TmImage[];
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
      dateTBD?: boolean;
      timeTBD?: boolean;
      noSpecificTime?: boolean;
    };
  };
  priceRanges?: TmPriceRange[];
  sales?: { public?: { startDateTime?: string; endDateTime?: string } };
  classifications?: TmClassification[];
  _embedded?: { venues?: TmVenue[]; attractions?: Array<{ name?: string }> };
}

interface TmEventsResponse {
  _embedded?: { events?: TmEvent[] };
  page?: { size: number; totalElements: number; totalPages: number; number: number };
}

// ---- Mapping helpers ----

function mapCategory(c?: TmClassification): EventCategory {
  const segment = c?.segment?.name?.toLowerCase() ?? "";
  const genre = c?.genre?.name?.toLowerCase() ?? "";
  if (genre.includes("comedy")) return "comedy";
  if (segment.includes("sports")) return "sports";
  if (segment.includes("music")) return "music";
  if (segment.includes("arts") || segment.includes("theatre") || segment.includes("theater"))
    return "arts-theater";
  if (segment.includes("film")) return "film";
  return "other";
}

/** Pick the best 16:9 image, preferring wide, high-res, non-fallback. */
function pickImage(images?: TmImage[]): string | null {
  if (!images?.length) return null;
  const ranked = [...images].sort((a, b) => {
    const aw = a.ratio === "16_9" ? 1 : 0;
    const bw = b.ratio === "16_9" ? 1 : 0;
    if (aw !== bw) return bw - aw;
    return (b.width ?? 0) - (a.width ?? 0);
  });
  return ranked[0]?.url ?? null;
}

function num(v?: string): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapEvent(e: TmEvent): EventInfo {
  const primaryClass =
    e.classifications?.find((c) => c.primary) ?? e.classifications?.[0];
  const venue = e._embedded?.venues?.[0];
  const price = e.priceRanges?.[0];
  const performers =
    e._embedded?.attractions?.map((a) => a.name).filter((n): n is string => !!n) ?? [];

  return {
    id: e.id,
    name: e.name,
    category: mapCategory(primaryClass),
    genre: primaryClass?.genre?.name ?? null,
    subGenre: primaryClass?.subGenre?.name ?? null,
    datetime: e.dates?.start?.dateTime ?? null,
    dateLocal: e.dates?.start?.localDate ?? null,
    timeTbd: Boolean(e.dates?.start?.timeTBD ?? e.dates?.start?.noSpecificTime),
    venue: venue
      ? {
          name: venue.name ?? "",
          city: venue.city?.name ?? "",
          state: venue.state?.stateCode ?? venue.state?.name ?? "",
          country: venue.country?.countryCode ?? venue.country?.name ?? "",
          lat: num(venue.location?.latitude),
          lon: num(venue.location?.longitude),
        }
      : null,
    performers,
    imageUrl: pickImage(e.images),
    url: e.url,
    currency: price?.currency ?? "USD",
    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    onSaleStart: e.sales?.public?.startDateTime ?? null,
    onSaleEnd: e.sales?.public?.endDateTime ?? null,
    source: "ticketmaster",
  };
}

// ---- Public client methods ----

/** Map our category to a Ticketmaster classificationName filter. */
function classificationName(category?: string): string | undefined {
  switch (category) {
    case "sports":
      return "Sports";
    case "music":
      return "Music";
    case "arts-theater":
      return "Arts & Theatre";
    case "comedy":
      return "Comedy";
    case "film":
      return "Film";
    default:
      return undefined;
  }
}

export interface SearchParams {
  keyword?: string;
  category?: string;
  city?: string;
  startDateTime?: string;
  endDateTime?: string;
  countryCode?: string;
  size?: number;
  page?: number;
  sort?: string;
}

export interface SearchResult {
  events: EventInfo[];
  page: number;
  totalPages: number;
  totalElements: number;
}

async function request(path: string, params: Record<string, string | undefined>) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("apikey", apiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) {
    throw new TicketmasterApiError(
      `Ticketmaster API responded ${res.status} ${res.statusText}`,
      res.status,
    );
  }
  return res.json();
}

export async function searchEvents(p: SearchParams): Promise<SearchResult> {
  const data = (await request("/events.json", {
    keyword: p.keyword,
    classificationName: classificationName(p.category),
    city: p.city,
    startDateTime: p.startDateTime,
    endDateTime: p.endDateTime,
    countryCode: p.countryCode ?? "US",
    size: String(p.size ?? 40),
    page: String(p.page ?? 0),
    sort: p.sort ?? "date,asc",
  })) as TmEventsResponse;

  return {
    events: (data._embedded?.events ?? []).map(mapEvent),
    page: data.page?.number ?? 0,
    totalPages: data.page?.totalPages ?? 1,
    totalElements: data.page?.totalElements ?? 0,
  };
}

export async function getEvent(id: string): Promise<EventInfo | null> {
  try {
    const data = (await request(`/events/${encodeURIComponent(id)}.json`, {})) as TmEvent;
    if (!data?.id) return null;
    return mapEvent(data);
  } catch (err) {
    if (err instanceof TicketmasterApiError && err.status === 404) return null;
    throw err;
  }
}
