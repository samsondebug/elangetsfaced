import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { AggregatedEvent } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { EventPoster } from "./EventPoster";
import { DealScoreMeter } from "./DealBadge";

export function DealOfTheDay({ data }: { data: AggregatedEvent }) {
  const { event, minPrice, dealScore, dealLabel, dealReason } = data;
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white dark:border-brand-500/20 dark:from-brand-500/10 dark:to-slate-900">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative aspect-[16/10] md:aspect-auto">
          <EventPoster
            src={event.imageUrl}
            alt={event.name}
            category={event.category}
            seed={event.id}
          />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white shadow">
            <Sparkles size={15} /> Top deal right now
          </span>
        </div>

        <div className="flex flex-col justify-center gap-4 p-6">
          <h2 className="text-2xl font-bold leading-tight">{event.name}</h2>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-2">
              <CalendarDays size={16} />
              {formatDate(event.datetime, event.timeTbd)}
            </p>
            {event.venue && (
              <p className="flex items-center gap-2">
                <MapPin size={16} />
                {event.venue.name}, {event.venue.city}
              </p>
            )}
          </div>

          {dealScore != null && dealLabel && (
            <div className="max-w-xs">
              <DealScoreMeter score={dealScore} label={dealLabel} />
            </div>
          )}
          {dealReason && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {dealReason}
            </p>
          )}

          <div className="mt-1 flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-400">Get-in price</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatPrice(minPrice, event.currency)}
              </p>
            </div>
            <Link href={`/events/${event.id}`} className="btn-primary ml-auto">
              See deal <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
