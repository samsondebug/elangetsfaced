"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { PriceAlert } from "@/lib/types";

export interface WatchedEvent {
  id: string;
  name: string;
  imageUrl: string | null;
  datetime: string | null;
  venueName: string | null;
  city: string | null;
  minPrice: number | null;
  currency: string;
  addedAt: string;
}

export function useWatchlist() {
  const [items, setItems, hydrated] = useLocalStorage<WatchedEvent[]>(
    "seatscout:watchlist",
    [],
  );

  const isWatched = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  const toggle = useCallback(
    (event: WatchedEvent) => {
      setItems((prev) =>
        prev.some((i) => i.id === event.id)
          ? prev.filter((i) => i.id !== event.id)
          : [{ ...event, addedAt: new Date().toISOString() }, ...prev],
      );
    },
    [setItems],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [setItems],
  );

  return { items, isWatched, toggle, remove, hydrated };
}

export function usePriceAlerts() {
  const [alerts, setAlerts, hydrated] = useLocalStorage<PriceAlert[]>(
    "seatscout:alerts",
    [],
  );

  const alertFor = useCallback(
    (eventId: string) => alerts.find((a) => a.eventId === eventId) ?? null,
    [alerts],
  );

  const setAlert = useCallback(
    (alert: PriceAlert) => {
      setAlerts((prev) => [
        alert,
        ...prev.filter((a) => a.eventId !== alert.eventId),
      ]);
    },
    [setAlerts],
  );

  const clearAlert = useCallback(
    (eventId: string) =>
      setAlerts((prev) => prev.filter((a) => a.eventId !== eventId)),
    [setAlerts],
  );

  return { alerts, alertFor, setAlert, clearAlert, hydrated };
}
