import type { EventCategory } from "@/lib/types";

/**
 * Illustrative venue layout. We don't yet have section-level resale inventory
 * (that needs partner APIs), so this is a generic seating-bowl diagram to orient
 * the buyer — clearly labeled as illustrative, not live seat data.
 */
export function VenueMap({ category }: { category: EventCategory }) {
  const isStage = category !== "sports";
  const tiers = [
    { label: "Upper level", color: "#16a34a", r: 150 },
    { label: "Mid level", color: "#ca8a04", r: 110 },
    { label: "Lower level", color: "#dc2626", r: 72 },
  ];

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Where you&apos;ll sit</h3>
        <span className="text-xs text-slate-400">Illustrative layout</span>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
        <svg
          viewBox="0 0 360 320"
          className="h-48 w-full max-w-xs"
          role="img"
          aria-label="Illustrative venue seating bowl"
        >
          {tiers.map((t) => (
            <ellipse
              key={t.label}
              cx={180}
              cy={150}
              rx={t.r}
              ry={t.r * 0.72}
              fill={t.color}
              fillOpacity={0.18}
              stroke={t.color}
              strokeOpacity={0.5}
              strokeWidth={2}
            />
          ))}
          {/* field / stage */}
          {isStage ? (
            <rect
              x={130}
              y={120}
              width={100}
              height={36}
              rx={6}
              fill="#0f172a"
              className="dark:fill-slate-700"
            />
          ) : (
            <ellipse cx={180} cy={150} rx={48} ry={32} fill="#22c55e" fillOpacity={0.35} />
          )}
          <text
            x={180}
            y={154}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill={isStage ? "#ffffff" : "#15803d"}
          >
            {isStage ? "STAGE" : "FIELD"}
          </text>
        </svg>

        <ul className="space-y-2 text-sm">
          {tiers
            .slice()
            .reverse()
            .map((t) => (
              <li key={t.label} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-slate-600 dark:text-slate-300">
                  {t.label}
                </span>
              </li>
            ))}
          <li className="pt-1 text-xs text-slate-400">
            Section-level pricing arrives with broker seat-map APIs.
          </li>
        </ul>
      </div>
    </div>
  );
}
