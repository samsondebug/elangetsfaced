import type { DealLabel } from "@/lib/types";
import { DEAL_META } from "@/lib/format";
import { TrendingDown } from "lucide-react";

export function DealBadge({
  label,
  score,
  showScore = true,
}: {
  label: DealLabel;
  score?: number | null;
  showScore?: boolean;
}) {
  const meta = DEAL_META[label];
  return (
    <span
      className={`chip ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}
      title="How this score is computed is shown on the event page"
    >
      <TrendingDown size={14} />
      {meta.label}
      {showScore && score != null && (
        <span className="font-bold tabular-nums">{score}</span>
      )}
    </span>
  );
}

/** Slim horizontal meter visualizing the 0-100 deal score. */
export function DealScoreMeter({
  score,
  label,
}: {
  score: number;
  label: DealLabel;
}) {
  const meta = DEAL_META[label];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{meta.label}</span>
        <span className="tabular-nums">{score}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${meta.bar} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
