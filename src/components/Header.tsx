"use client";

import Link from "next/link";
import { Heart, Ticket } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useWatchlist } from "@/hooks/useWatchlist";

export function Header() {
  const { items, hydrated } = useWatchlist();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Ticket size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Seat<span className="text-brand-600">Scout</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/watchlist"
            className="relative inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Heart size={16} />
            <span className="hidden sm:inline">Watchlist</span>
            {hydrated && items.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {items.length}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
