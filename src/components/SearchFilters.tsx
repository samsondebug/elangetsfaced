"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { SearchFilters as Filters, SortKey } from "@/lib/types";
import { CATEGORY_OPTIONS } from "@/lib/format";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "date", label: "Soonest" },
  { value: "deal", label: "Best deal" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function SearchFilters({
  filters,
  onChange,
  onSubmit,
}: {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onSubmit: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="card p-4 sm:p-5">
      {/* Search row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="input pl-10"
            placeholder="Search teams, artists, shows… (e.g. Lakers, Taylor Swift)"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
          />
        </div>
        <input
          className="input sm:w-44"
          placeholder="City"
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
        <button type="submit" className="btn-primary sm:w-auto">
          <Search size={16} /> Search
        </button>
      </form>

      {/* Category chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((c) => {
          const active = filters.category === c.value;
          return (
            <button
              key={c.value}
              onClick={() => {
                onChange({ category: c.value });
                onSubmit();
              }}
              className={`chip border ${
                active
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Sort</span>
          <select
            className="input w-auto py-1.5"
            value={filters.sort}
            onChange={(e) => {
              onChange({ sort: e.target.value as SortKey });
              onSubmit();
            }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="btn-ghost py-1.5"
        >
          <SlidersHorizontal size={15} />
          Filters
        </button>

        {(filters.dateFrom || filters.dateTo || filters.maxPrice) && (
          <button
            onClick={() => {
              onChange({ dateFrom: null, dateTo: null, maxPrice: null });
              onSubmit();
            }}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-rose-500"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Advanced */}
      {showAdvanced && (
        <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">
              From date
            </span>
            <input
              type="date"
              className="input"
              value={filters.dateFrom ?? ""}
              onChange={(e) => onChange({ dateFrom: e.target.value || null })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">
              To date
            </span>
            <input
              type="date"
              className="input"
              value={filters.dateTo ?? ""}
              onChange={(e) => onChange({ dateTo: e.target.value || null })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">
              Max get-in price
              {filters.maxPrice ? `: $${filters.maxPrice}` : ""}
            </span>
            <input
              type="range"
              min={25}
              max={1000}
              step={25}
              className="w-full accent-brand-600"
              value={filters.maxPrice ?? 1000}
              onChange={(e) =>
                onChange({
                  maxPrice:
                    Number(e.target.value) >= 1000 ? null : Number(e.target.value),
                })
              }
            />
          </label>
          <div className="sm:col-span-3">
            <button onClick={onSubmit} className="btn-primary">
              Apply filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
