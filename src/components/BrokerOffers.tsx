import { ArrowUpRight, BadgeCheck } from "lucide-react";
import type { AggregatedEvent } from "@/lib/types";
import { getBroker } from "@/lib/brokers/registry";
import { formatPrice } from "@/lib/format";

/**
 * Cross-broker price comparison table. The cheapest get-in is highlighted as the
 * best deal. Each row links straight to that broker's checkout.
 */
export function BrokerOffers({ data }: { data: AggregatedEvent }) {
  const offers = [...data.offers].sort((a, b) => {
    const ap = a.getInPrice ?? Number.POSITIVE_INFINITY;
    const bp = b.getInPrice ?? Number.POSITIVE_INFINITY;
    return ap - bp;
  });
  const bestId = data.bestOffer?.brokerId;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <h3 className="font-semibold">Compare brokers</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {offers.filter((o) => o.getInPrice != null).length} of {offers.length}{" "}
          brokers have inventory.{" "}
          {data.savings && data.savings > 0
            ? `You save ${formatPrice(data.savings, data.event.currency)} buying the cheapest.`
            : "More brokers light up as you connect their APIs."}
        </p>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {offers.map((o) => {
          const broker = getBroker(o.brokerId);
          const isBest = o.brokerId === bestId && o.getInPrice != null;
          return (
            <li
              key={o.brokerId}
              className={`flex items-center gap-4 p-4 ${
                isBest ? "bg-emerald-50/60 dark:bg-emerald-500/5" : ""
              }`}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: broker.color }}
              >
                {broker.short}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {broker.name}
                  {isBest && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                      <BadgeCheck size={12} /> Best deal
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {o.available
                    ? `${broker.allInPricing ? "All-in pricing" : "Fees added at checkout"}${
                        o.listingCount ? ` · ${o.listingCount} listings` : ""
                      }`
                    : "No inventory yet"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums">
                  {formatPrice(o.getInPrice, o.currency)}
                </p>
                {o.maxPrice != null && (
                  <p className="text-xs text-slate-400">
                    up to {formatPrice(o.maxPrice, o.currency)}
                  </p>
                )}
              </div>
              <a
                href={o.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isBest
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                } ${o.available ? "" : "pointer-events-none opacity-40"}`}
              >
                Buy <ArrowUpRight size={15} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
