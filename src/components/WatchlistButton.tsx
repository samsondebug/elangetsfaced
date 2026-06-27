"use client";

import { Heart } from "lucide-react";
import { useWatchlist, type WatchedEvent } from "@/hooks/useWatchlist";

export function WatchlistButton({
  event,
  variant = "icon",
}: {
  event: WatchedEvent;
  variant?: "icon" | "full";
}) {
  const { isWatched, toggle, hydrated } = useWatchlist();
  const active = hydrated && isWatched(event.id);

  if (variant === "full") {
    return (
      <button
        onClick={() => toggle(event)}
        className={`btn-ghost ${active ? "text-rose-600 dark:text-rose-400" : ""}`}
        aria-pressed={active}
      >
        <Heart size={16} className={active ? "fill-current" : ""} />
        {active ? "Watching" : "Watch price"}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(event);
      }}
      aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={active}
      className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${
        active
          ? "bg-rose-600 text-white"
          : "bg-black/40 text-white hover:bg-black/60"
      }`}
    >
      <Heart size={16} className={active ? "fill-current" : ""} />
    </button>
  );
}
