import { ArrowUpRight, Layers } from "lucide-react";
import type { TicketListing } from "@/lib/types";
import { getBroker } from "@/lib/brokers/registry";
import { formatPrice } from "@/lib/format";

/**
 * Real seat-level inventory (section / row / quantity / price) from TicketsData.
 * Sorted cheapest-first; the lowest listing is flagged as the get-in.
 */
export function LiveListings({
  listings,
  currency,
  quotaRemaining,
}: {
  listings: TicketListing[];
  currency: string;
  quotaRemaining?: number | null;
}) {
  if (!listings.length) return null;
  const sorted = [...listings].sort((a, b) => a.price - b.price);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Layers size={16} /> Live listings
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {sorted.length} real listings · cheapest first
          </p>
        </div>
        {quotaRemaining != null && (
          <span className="text-xs text-slate-400">
            {quotaRemaining.toLocaleString()} credits left
          </span>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-800/80">
            <tr>
              <th className="p-3 font-medium">Section</th>
              <th className="p-3 font-medium">Row</th>
              <th className="p-3 font-medium">Qty</th>
              <th className="p-3 text-right font-medium">Price</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((l, i) => {
              const broker = getBroker(l.platform);
              return (
                <tr
                  key={`${l.section}-${l.row}-${i}`}
                  className={i === 0 ? "bg-emerald-50/60 dark:bg-emerald-500/5" : ""}
                >
                  <td className="p-3 font-medium">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: broker.color }}
                        title={broker.name}
                      />
                      {l.section}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{l.row}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{l.quantity}</td>
                  <td className="p-3 text-right font-bold tabular-nums">
                    {formatPrice(l.price, currency)}
                    {i === 0 && (
                      <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                        Get-in
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {l.url && (
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                      >
                        Buy <ArrowUpRight size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
