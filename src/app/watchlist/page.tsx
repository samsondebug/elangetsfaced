"use client";

import Link from "next/link";
import { Bell, Heart, Trash2 } from "lucide-react";
import { useWatchlist, usePriceAlerts } from "@/hooks/useWatchlist";
import { EventPoster } from "@/components/EventPoster";
import { formatDate, formatPrice } from "@/lib/format";

export default function WatchlistPage() {
  const { items, remove, hydrated } = useWatchlist();
  const { alerts, clearAlert } = usePriceAlerts();

  if (!hydrated) return null;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Heart className="text-rose-500" /> Your watchlist
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Saved events and price alerts live in your browser — no account needed.
        </p>
      </header>

      {/* Price alerts */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Bell size={18} /> Price alerts
          </h2>
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {alerts.map((a) => {
              const watched = items.find((i) => i.id === a.eventId);
              const triggered =
                watched?.minPrice != null && watched.minPrice <= a.targetPrice;
              return (
                <div
                  key={a.eventId}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/events/${a.eventId}`}
                      className="truncate font-medium hover:text-brand-600"
                    >
                      {a.eventName}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Target {formatPrice(a.targetPrice, a.currency)}
                      {watched?.minPrice != null &&
                        ` · now ${formatPrice(watched.minPrice, a.currency)}`}
                    </p>
                  </div>
                  {triggered && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                      🎯 Price hit!
                    </span>
                  )}
                  <button
                    onClick={() => clearAlert(a.eventId)}
                    className="text-slate-400 hover:text-rose-500"
                    aria-label="Remove alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Saved events */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Saved events</h2>
        {items.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-12 text-center">
            <span className="text-4xl">💔</span>
            <p className="font-semibold">Nothing saved yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tap the heart on any event to track its price here.
            </p>
            <Link href="/" className="btn-primary mt-2">
              Browse events
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <div key={i.id} className="card flex overflow-hidden">
                <Link href={`/events/${i.id}`} className="h-auto w-28 shrink-0">
                  <EventPoster
                    src={i.imageUrl}
                    alt={i.name}
                    category="other"
                    seed={i.id}
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col p-3">
                  <Link
                    href={`/events/${i.id}`}
                    className="line-clamp-2 text-sm font-semibold hover:text-brand-600"
                  >
                    {i.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(i.datetime).split("·")[0].trim()}
                  </p>
                  {i.city && (
                    <p className="truncate text-xs text-slate-400">{i.city}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-sm font-bold tabular-nums">
                      {formatPrice(i.minPrice, i.currency)}
                    </span>
                    <button
                      onClick={() => remove(i.id)}
                      className="text-slate-400 hover:text-rose-500"
                      aria-label="Remove from watchlist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
