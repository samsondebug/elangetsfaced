"use client";

import { Bell, BellRing, Check } from "lucide-react";
import { useState } from "react";
import { usePriceAlerts } from "@/hooks/useWatchlist";
import { formatPrice } from "@/lib/format";

/**
 * Set a target price for an event. When the get-in price drops to/below the
 * target, the watchlist page flags it. (Real push/email delivery would hook in a
 * background job + the broker price feed — the data + target are already here.)
 */
export function PriceAlert({
  eventId,
  eventName,
  currentPrice,
  currency,
}: {
  eventId: string;
  eventName: string;
  currentPrice: number | null;
  currency: string;
}) {
  const { alertFor, setAlert, clearAlert, hydrated } = usePriceAlerts();
  const existing = hydrated ? alertFor(eventId) : null;
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number>(
    existing?.targetPrice ??
      (currentPrice ? Math.max(10, Math.round(currentPrice * 0.85)) : 50),
  );

  if (existing && !open) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
        <span className="inline-flex items-center gap-2 font-medium">
          <BellRing size={16} className="text-brand-600" />
          Alert set at {formatPrice(existing.targetPrice, currency)}
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => setOpen(true)}
            className="text-brand-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => clearAlert(eventId)}
            className="text-slate-500 hover:text-rose-500"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost w-full">
        <Bell size={16} /> Set a price alert
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-sm font-medium">
        Notify me when get-in drops to or below:
      </p>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            $
          </span>
          <input
            type="number"
            min={1}
            className="input pl-7"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </div>
        <button
          onClick={() => {
            setAlert({
              eventId,
              eventName,
              targetPrice: target,
              currency,
              createdAt: new Date().toISOString(),
            });
            setOpen(false);
          }}
          className="btn-primary"
        >
          <Check size={16} /> Save
        </button>
      </div>
      {currentPrice != null && (
        <p className="text-xs text-slate-400">
          Current get-in: {formatPrice(currentPrice, currency)}
        </p>
      )}
    </div>
  );
}
