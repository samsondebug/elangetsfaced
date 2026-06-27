"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Info,
  MapPin,
  Users,
} from "lucide-react";
import type { AggregatedEvent } from "@/lib/types";
import { CATEGORY_META, formatDate, formatPrice } from "@/lib/format";
import { EventPoster } from "@/components/EventPoster";
import { DealBadge, DealScoreMeter } from "@/components/DealBadge";
import { BrokerOffers } from "@/components/BrokerOffers";
import { WatchlistButton } from "@/components/WatchlistButton";
import { PriceAlert } from "@/components/PriceAlert";

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<AggregatedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/events/${params.id}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Couldn't load this event.");
        }
        const json = (await res.json()) as AggregatedEvent;
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) return <DetailSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="card p-10 text-center">
          <p className="font-semibold">{error ?? "Event not found"}</p>
          <Link href="/" className="btn-primary mt-4 inline-flex">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const { event, minPrice, dealLabel, dealScore, dealReason, savings } = data;
  const watched = {
    id: event.id,
    name: event.name,
    imageUrl: event.imageUrl,
    datetime: event.datetime,
    venueName: event.venue?.name ?? null,
    city: event.venue?.city ?? null,
    minPrice,
    currency: event.currency,
    addedAt: "",
  };

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Main */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/9]">
              <EventPoster
                src={event.imageUrl}
                alt={event.name}
                category={event.category}
                seed={event.id}
              />
              <div className="absolute right-3 top-3">
                <WatchlistButton event={watched} />
              </div>
              {dealLabel && (
                <div className="absolute bottom-3 left-3">
                  <DealBadge label={dealLabel} score={dealScore} />
                </div>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {CATEGORY_META[event.category].emoji}{" "}
                  {event.genre ?? CATEGORY_META[event.category].label}
                  {event.subGenre ? ` · ${event.subGenre}` : ""}
                </span>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  {event.name}
                </h1>
              </div>
              <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {formatDate(event.datetime, event.timeTbd)}
                </p>
                {event.venue && (
                  <p className="flex items-center gap-2">
                    <MapPin size={16} />
                    {event.venue.name}
                    {event.venue.city ? `, ${event.venue.city}` : ""}
                    {event.venue.state ? `, ${event.venue.state}` : ""}
                  </p>
                )}
                {event.performers.length > 0 && (
                  <p className="flex items-center gap-2">
                    <Users size={16} />
                    {event.performers.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <BrokerOffers data={data} />

          {/* Score explainer */}
          {dealScore != null && dealLabel && (
            <div className="card space-y-3 p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <Info size={16} /> How we scored this deal
              </h3>
              <DealScoreMeter score={dealScore} label={dealLabel} />
              {dealReason && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {dealReason}.
                </p>
              )}
              <p className="text-xs text-slate-400">
                Scores are computed from real broker price data. With a single
                broker connected we compare against typical prices for the same
                category; once a second broker is configured the score reflects
                the actual cross-broker price spread.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card space-y-4 p-5">
            <div>
              <p className="text-sm text-slate-400">Best get-in price</p>
              <p className="text-3xl font-bold tabular-nums">
                {formatPrice(minPrice, event.currency)}
              </p>
              {savings && savings > 0 && (
                <p className="text-sm font-medium text-emerald-600">
                  Save {formatPrice(savings, event.currency)} vs the priciest broker
                </p>
              )}
            </div>
            {data.bestOffer && (
              <a
                href={data.bestOffer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full"
              >
                Buy on {data.bestOffer.brokerName}
              </a>
            )}
            <WatchlistButton event={watched} variant="full" />
            <PriceAlert
              eventId={event.id}
              eventName={event.name}
              currentPrice={minPrice}
              currency={event.currency}
            />
          </div>

          {(event.priceMin != null || event.onSaleStart) && (
            <div className="card space-y-2 p-5 text-sm">
              <h3 className="font-semibold">Event facts</h3>
              {event.priceMin != null && (
                <Row
                  label="Face price range"
                  value={`${formatPrice(event.priceMin, event.currency)} – ${formatPrice(
                    event.priceMax,
                    event.currency,
                  )}`}
                />
              )}
              {event.onSaleStart && (
                <Row
                  label="On sale"
                  value={formatDate(event.onSaleStart).split("·")[0].trim()}
                />
              )}
              <Row label="Source" value="Ticketmaster Discovery" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-slate-100 py-1.5 first:border-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"
    >
      <ArrowLeft size={16} /> Back to search
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card shimmer aspect-[16/9] bg-slate-200 dark:bg-slate-800" />
        <div className="card shimmer h-64 bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
