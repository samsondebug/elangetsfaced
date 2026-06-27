import Link from "next/link";
import { CalendarDays, MapPin, Tag, Users } from "lucide-react";
import type { AggregatedEvent } from "@/lib/types";
import { CATEGORY_META, formatDate, formatPrice } from "@/lib/format";
import { DealBadge } from "./DealBadge";
import { EventPoster } from "./EventPoster";
import { WatchlistButton } from "./WatchlistButton";
import { BrokerDot } from "./BrokerChip";

export function EventCard({ data }: { data: AggregatedEvent }) {
  const { event, minPrice, dealLabel, dealScore, brokerCount, savings, offers } =
    data;
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
    <Link
      href={`/events/${event.id}`}
      className="card group flex flex-col overflow-hidden animate-fade-in"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <EventPoster
          src={event.imageUrl}
          alt={event.name}
          category={event.category}
          seed={event.id}
          className="transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="chip bg-black/55 text-xs text-white backdrop-blur">
            {CATEGORY_META[event.category].emoji}{" "}
            {event.genre ?? CATEGORY_META[event.category].label}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <WatchlistButton event={watched} />
        </div>
        {dealLabel && (
          <div className="absolute bottom-3 left-3">
            <DealBadge label={dealLabel} score={dealScore} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{event.name}</h3>

        <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-2">
            <CalendarDays size={15} className="shrink-0" />
            <span className="truncate">{formatDate(event.datetime, event.timeTbd)}</span>
          </p>
          {event.venue && (
            <p className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0" />
              <span className="truncate">
                {event.venue.name}
                {event.venue.city ? `, ${event.venue.city}` : ""}
              </span>
            </p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-400">From</p>
            <p className="text-xl font-bold tabular-nums">
              {formatPrice(minPrice, event.currency)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users size={13} />
              {brokerCount > 0 ? (
                <span>
                  {brokerCount} broker{brokerCount > 1 ? "s" : ""}
                </span>
              ) : (
                <span>Not yet on sale</span>
              )}
              <span className="flex gap-1">
                {offers
                  .filter((o) => o.getInPrice != null)
                  .map((o) => (
                    <BrokerDot key={o.brokerId} id={o.brokerId} />
                  ))}
              </span>
            </div>
            {savings && savings > 0 && (
              <span className="chip bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Tag size={12} /> Save {formatPrice(savings, event.currency)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="shimmer aspect-[16/9] bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-3 p-4">
        <div className="shimmer h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="shimmer h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="shimmer h-8 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
