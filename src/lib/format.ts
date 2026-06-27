import type { DealLabel, EventCategory } from "@/lib/types";

export function formatPrice(
  value: number | null | undefined,
  currency = "USD",
): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(iso: string | null, timeTbd = false): string {
  if (!iso) return "Date TBD";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (timeTbd) return `${date} · Time TBD`;
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const DEAL_META: Record<
  DealLabel,
  { label: string; text: string; bg: string; ring: string; bar: string }
> = {
  great: {
    label: "Great deal",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    ring: "ring-emerald-500/30",
    bar: "bg-emerald-500",
  },
  good: {
    label: "Good deal",
    text: "text-lime-700 dark:text-lime-300",
    bg: "bg-lime-100 dark:bg-lime-500/15",
    ring: "ring-lime-500/30",
    bar: "bg-lime-500",
  },
  fair: {
    label: "Fair price",
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-500/15",
    ring: "ring-amber-500/30",
    bar: "bg-amber-500",
  },
  high: {
    label: "Above market",
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-100 dark:bg-rose-500/15",
    ring: "ring-rose-500/30",
    bar: "bg-rose-500",
  },
};

export const CATEGORY_META: Record<
  EventCategory,
  { label: string; emoji: string }
> = {
  sports: { label: "Sports", emoji: "🏟️" },
  music: { label: "Concerts", emoji: "🎵" },
  "arts-theater": { label: "Theater", emoji: "🎭" },
  comedy: { label: "Comedy", emoji: "🎤" },
  film: { label: "Film", emoji: "🎬" },
  other: { label: "Other", emoji: "🎟️" },
};

export const CATEGORY_OPTIONS: { value: EventCategory | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "sports", label: "Sports", emoji: "🏟️" },
  { value: "music", label: "Concerts", emoji: "🎵" },
  { value: "arts-theater", label: "Theater", emoji: "🎭" },
  { value: "comedy", label: "Comedy", emoji: "🎤" },
  { value: "film", label: "Film", emoji: "🎬" },
];

/** Deterministic gradient from a string seed for poster fallbacks. */
export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${(h + 50) % 360} 65% 35%))`;
}
