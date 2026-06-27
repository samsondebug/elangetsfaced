import type { BrokerId } from "@/lib/types";

// TicketsData API client — unified real-time listings across 10 marketplaces.
// Docs: https://ticketsdata.com/docs
//
// Endpoint:  GET https://ticketsdata.com/fetch
// Auth:      username (account email) + password, passed as query params.
//            Store them in env vars — never hardcode or log full URLs.
// Params:    platform (ticketmaster|stubhub|seatgeek|vividseats|gametime|
//            tickpick|viagogo|dice|eventbrite|axs) + event_url
// Returns:   { status, body, response_s, quota_remaining } where `body` is the
//            normalized listing inventory for that event.
//
// Credits are consumed per fetch, so we call this on-demand (event detail page),
// not for the whole grid. Everything here is gated behind credentials: with none
// set, ticketsdataEnabled() is false and callers fall back to Ticketmaster-only.

const BASE = "https://ticketsdata.com";

/** TicketsData platform slugs mapped to our broker ids where they overlap. */
export const TD_PLATFORMS = [
  "ticketmaster",
  "stubhub",
  "seatgeek",
  "vividseats",
  "gametime",
  "tickpick",
  "viagogo",
  "dice",
  "eventbrite",
  "axs",
] as const;
export type TdPlatform = (typeof TD_PLATFORMS)[number];

export function ticketsdataEnabled(): boolean {
  return Boolean(
    process.env.TICKETSDATA_USERNAME && process.env.TICKETSDATA_PASSWORD,
  );
}

/** A normalized seat-level listing. */
export interface TdListing {
  platform: TdPlatform;
  section: string;
  row: string;
  quantity: number;
  /** all-in / per-ticket price as reported by the platform. */
  price: number;
  url: string | null;
}

export interface TdFetchResult {
  listings: TdListing[];
  getInPrice: number | null;
  quotaRemaining: number | null;
}

function creds(): { username: string; password: string } | null {
  const username = process.env.TICKETSDATA_USERNAME;
  const password = process.env.TICKETSDATA_PASSWORD;
  return username && password ? { username, password } : null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Defensively normalize a raw listing object. The exact field names in `body`
 * are confirmed against a live sample; we probe the documented fields (section,
 * row, quantity, price) plus common aliases so a minor naming difference never
 * crashes the page — at worst a field comes back empty.
 */
function normalizeListing(raw: unknown, platform: TdPlatform): TdListing | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const price =
    num(r.price) ??
    num(r.amount) ??
    num(r.price_each) ??
    num(r.unit_price) ??
    num(r.total);
  if (price == null) return null;
  return {
    platform,
    section: String(r.section ?? r.sec ?? r.zone ?? "—"),
    row: String(r.row ?? r.row_name ?? "—"),
    quantity: num(r.quantity ?? r.qty ?? r.available) ?? 1,
    price,
    url:
      typeof r.url === "string"
        ? r.url
        : typeof r.link === "string"
          ? r.link
          : null,
  };
}

/** Pull listings out of the response envelope, tolerant of body shape. */
function extractListings(body: unknown, platform: TdPlatform): TdListing[] {
  let arr: unknown[] = [];
  if (Array.isArray(body)) arr = body;
  else if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (Array.isArray(b.listings)) arr = b.listings;
    else if (Array.isArray(b.tickets)) arr = b.tickets;
    else if (Array.isArray(b.results)) arr = b.results;
  }
  return arr
    .map((x) => normalizeListing(x, platform))
    .filter((l): l is TdListing => l != null);
}

/** Fetch real listings for one event URL on one platform. */
export async function fetchListings(
  platform: TdPlatform,
  eventUrl: string,
): Promise<TdFetchResult> {
  const c = creds();
  if (!c) return { listings: [], getInPrice: null, quotaRemaining: null };

  const url = new URL(`${BASE}/fetch`);
  url.searchParams.set("username", c.username);
  url.searchParams.set("password", c.password);
  url.searchParams.set("platform", platform);
  url.searchParams.set("event_url", eventUrl);

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new TicketsDataError(`TicketsData ${res.status}`, res.status);
  const data = (await res.json()) as {
    status?: string;
    body?: unknown;
    quota_remaining?: number;
  };

  const listings = extractListings(data.body, platform);
  const getInPrice = listings.length
    ? Math.min(...listings.map((l) => l.price))
    : null;
  return {
    listings,
    getInPrice,
    quotaRemaining: data.quota_remaining ?? null,
  };
}

/** One marketplace's URL for the same real-world event. */
export interface TdMatch {
  platform: TdPlatform;
  eventUrl: string;
}

const isPlatform = (s: string): s is TdPlatform =>
  (TD_PLATFORMS as readonly string[]).includes(s);

/** Parse the /match response into platform→URL pairs, tolerant of shape. */
function parseMatches(body: unknown): TdMatch[] {
  // Shape A: { ticketmaster: "url", stubhub: "url", ... }
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const b = body as Record<string, unknown>;
    const nested =
      (Array.isArray(b.matches) && b.matches) ||
      (Array.isArray(b.results) && b.results) ||
      null;
    if (!nested) {
      const out: TdMatch[] = [];
      for (const [k, v] of Object.entries(b)) {
        if (!isPlatform(k.toLowerCase())) continue;
        const url =
          typeof v === "string"
            ? v
            : v && typeof v === "object"
              ? String((v as Record<string, unknown>).url ?? (v as Record<string, unknown>).event_url ?? "")
              : "";
        if (url) out.push({ platform: k.toLowerCase() as TdPlatform, eventUrl: url });
      }
      if (out.length) return out;
    }
  }
  // Shape B: [ { platform, event_url } , ... ]
  const arr: unknown[] = Array.isArray(body)
    ? body
    : body && typeof body === "object"
      ? ((body as Record<string, unknown>).matches as unknown[]) ??
        ((body as Record<string, unknown>).results as unknown[]) ??
        []
      : [];
  return (arr ?? [])
    .map((x): TdMatch | null => {
      if (!x || typeof x !== "object") return null;
      const r = x as Record<string, unknown>;
      const platform = String(r.platform ?? r.marketplace ?? r.site ?? "").toLowerCase();
      if (!isPlatform(platform)) return null;
      const eventUrl =
        typeof r.event_url === "string"
          ? r.event_url
          : typeof r.url === "string"
            ? r.url
            : "";
      return eventUrl ? { platform: platform as TdPlatform, eventUrl } : null;
    })
    .filter((m): m is TdMatch => m != null);
}

/**
 * Resolve the same event across marketplaces via TicketsData `/match`. We probe
 * the documented identifiers (name + date, plus the canonical event URL) so the
 * call works regardless of which the endpoint keys on. Returns [] on any error
 * or unexpected shape — never throws.
 */
export async function matchEvent(opts: {
  name: string;
  date?: string | null;
  eventUrl?: string;
}): Promise<TdMatch[]> {
  const c = creds();
  if (!c) return [];
  const url = new URL(`${BASE}/match`);
  url.searchParams.set("username", c.username);
  url.searchParams.set("password", c.password);
  url.searchParams.set("keyword", opts.name);
  url.searchParams.set("name", opts.name);
  if (opts.date) url.searchParams.set("date", opts.date);
  if (opts.eventUrl) url.searchParams.set("event_url", opts.eventUrl);
  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { body?: unknown };
    return parseMatches(data.body);
  } catch {
    return [];
  }
}

export class TicketsDataError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** TicketsData platform slugs are identical to our broker ids. */
export function tdPlatformToBroker(p: TdPlatform): BrokerId {
  return p as BrokerId;
}
