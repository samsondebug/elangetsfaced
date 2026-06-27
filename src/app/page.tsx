"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Sparkles, Ticket, Zap } from "lucide-react";
import type { AggregatedEvent, EventsResponse, SearchFilters } from "@/lib/types";
import { EventCard, EventCardSkeleton } from "@/components/EventCard";
import { SearchFilters as SearchFiltersBar } from "@/components/SearchFilters";
import { DealOfTheDay } from "@/components/DealOfTheDay";
import { HowItWorks } from "@/components/HowItWorks";

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  category: "all",
  city: "",
  dateFrom: null,
  dateTo: null,
  maxPrice: null,
  sort: "date",
};

function buildQuery(f: SearchFilters): string {
  const p = new URLSearchParams();
  if (f.query) p.set("q", f.query);
  if (f.category !== "all") p.set("category", f.category);
  if (f.city) p.set("city", f.city);
  if (f.dateFrom) p.set("dateFrom", f.dateFrom);
  if (f.dateTo) p.set("dateTo", f.dateTo);
  if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
  p.set("sort", f.sort);
  return p.toString();
}

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const run = useCallback(async (f: SearchFilters) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events?${buildQuery(f)}`);
      const json = (await res.json()) as EventsResponse;
      if (id === reqId.current) setData(json);
    } catch {
      if (id === reqId.current)
        setError("Something went wrong loading events. Please try again.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // Initial load.
  useEffect(() => {
    run(DEFAULT_FILTERS);
  }, [run]);

  const onChange = (next: Partial<SearchFilters>) =>
    setFilters((prev) => ({ ...prev, ...next }));
  const onSubmit = () => run(filters);

  const events = data?.events ?? [];
  const dealOfDay = bestDeal(events);
  const notice = data?.notice ?? null;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Find the <span className="text-brand-600">best seats</span> for less.
        </h1>
        <p className="max-w-2xl text-slate-500 dark:text-slate-400">
          SeatScout compares live ticket prices across brokers and scores every
          event so you instantly see where the deals are — sports, concerts,
          comedy and theater.
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-sm">
          <Stat
            icon={<Ticket size={15} />}
            label={
              loading
                ? "Loading events…"
                : `${events.filter((e) => e.minPrice != null).length} with live prices`
            }
          />
          <Stat
            icon={<Zap size={15} />}
            label={`${(data?.liveBrokers ?? []).length || 1} live broker${
              (data?.liveBrokers ?? []).length === 1 ? "" : "s"
            }`}
          />
          <Stat icon={<Sparkles size={15} />} label="Transparent deal scores" />
        </div>
      </section>

      <SearchFiltersBar filters={filters} onChange={onChange} onSubmit={onSubmit} />

      {notice && <NoticeBanner message={notice} />}
      {error && <NoticeBanner message={error} />}

      {!loading && dealOfDay && !notice && <DealOfTheDay data={dealOfDay} />}

      {/* Results */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {loading
              ? "Searching…"
              : `${events.length} event${events.length === 1 ? "" : "s"}`}
          </h2>
        </div>

        {loading ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </Grid>
        ) : events.length === 0 && !notice ? (
          <EmptyState />
        ) : (
          <Grid>
            {events.map((e) => (
              <EventCard key={e.event.id} data={e} />
            ))}
          </Grid>
        )}
      </section>

      <HowItWorks />
    </div>
  );
}

function bestDeal(events: AggregatedEvent[]): AggregatedEvent | null {
  const scored = events.filter((e) => e.dealScore != null);
  if (!scored.length) return null;
  return scored.reduce((best, e) =>
    (e.dealScore ?? 0) > (best.dealScore ?? 0) ? e : best,
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {icon}
      {label}
    </span>
  );
}

function NoticeBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">Heads up</p>
        <p>{message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center gap-2 p-12 text-center">
      <span className="text-4xl">🔍</span>
      <p className="font-semibold">No events match your search</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Try a different keyword, widen your dates, or clear filters.
      </p>
    </div>
  );
}
