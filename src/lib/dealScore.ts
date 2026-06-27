import type { BrokerOffer, DealLabel } from "@/lib/types";
import { getBroker } from "@/lib/brokers/registry";

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function labelFor(score: number): DealLabel {
  if (score >= 75) return "great";
  if (score >= 58) return "good";
  if (score >= 42) return "fair";
  return "high";
}

const clamp = (n: number) => Math.max(1, Math.min(100, Math.round(n)));

export interface ScoreResult {
  score: number;
  label: DealLabel;
  reason: string;
}

/**
 * Cross-broker scoring — only used when ≥2 brokers report a price. Rewards the
 * cheapest broker by how much it undercuts the next-cheapest. This is the
 * "real" deal signal and kicks in automatically once a second broker (SeatGeek)
 * is configured.
 */
export function scoreCrossBroker(offers: BrokerOffer[]): ScoreResult | null {
  const priced = offers
    .filter((o) => o.getInPrice != null)
    .sort((a, b) => (a.getInPrice as number) - (b.getInPrice as number));
  if (priced.length < 2) return null;

  const min = priced[0].getInPrice as number;
  const next = priced[1].getInPrice as number;
  const savingsPct = next > 0 ? (next - min) / next : 0;
  const score = clamp(55 + savingsPct * 220);
  const cheapest = getBroker(priced[0].brokerId).name;
  const reason =
    next > min
      ? `Cheapest on ${cheapest} — $${Math.round(next - min)} below the next broker`
      : `Matched lowest across ${priced.length} brokers on ${cheapest}`;
  return { score, label: labelFor(score), reason };
}

/**
 * Category-relative scoring — the honest fallback when only Ticketmaster data is
 * available. Compares this event's get-in price to the median get-in price of
 * other events in the same category currently loaded. Cheaper-than-peers ranks
 * higher. Derived entirely from real price ranges, no invented numbers.
 */
export function scoreCategoryRelative(
  price: number,
  categoryMedian: number,
  categoryLabel: string,
): ScoreResult {
  if (categoryMedian <= 0) {
    return { score: 50, label: "fair", reason: `$${Math.round(price)} get-in` };
  }
  const ratio = price / categoryMedian;
  const score = clamp(50 + (1 - ratio) * 120);
  const pct = Math.round(Math.abs(1 - ratio) * 100);
  const dir = ratio < 1 ? "below" : "above";
  const reason =
    pct < 4
      ? `$${Math.round(price)} get-in — right around the typical ${categoryLabel} price`
      : `$${Math.round(price)} get-in — ${pct}% ${dir} the typical ${categoryLabel} price`;
  return { score, label: labelFor(score), reason };
}
