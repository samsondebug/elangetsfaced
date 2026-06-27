import {
  BellRing,
  GitCompareArrows,
  Heart,
  Search,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { BROKER_LIST } from "@/lib/brokers/registry";

const FEATURES = [
  {
    icon: Search,
    title: "Search everything",
    body: "Sports, concerts, comedy and theater from the Ticketmaster Discovery API — filter by city, date, category and price.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare brokers",
    body: "See the cheapest get-in price side by side and how much you save. A pluggable layer adds new marketplaces with one file.",
  },
  {
    icon: TrendingDown,
    title: "Transparent deal scores",
    body: "Every event scored 0–100 from real prices — with the reason shown. No black box, no inflated 'discounts'.",
  },
  {
    icon: Heart,
    title: "Watchlist",
    body: "Save events you care about. Stored in your browser — no account, no sign-up, no spam.",
  },
  {
    icon: BellRing,
    title: "Price alerts",
    body: "Set a target price and get flagged when the get-in drops to or below it.",
  },
  {
    icon: ShieldCheck,
    title: "Honest by design",
    body: "Only real broker data is ever shown. If a broker isn't connected, it simply doesn't display a price.",
  },
];

export function HowItWorks() {
  return (
    <section className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          One dashboard for every deal
        </h2>
        <p className="mx-auto mt-1 max-w-2xl text-slate-500 dark:text-slate-400">
          SeatScout pulls live event data and scores it so you don&apos;t have to
          tab between a dozen ticket sites.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15">
              <f.icon size={20} />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {f.body}
            </p>
          </div>
        ))}
      </div>

      {/* Broker trust strip */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Comparing across
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {BROKER_LIST.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: b.color }}
            >
              {b.name}
            </span>
          ))}
          <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-400 dark:border-slate-700">
            + more soon
          </span>
        </div>
      </div>
    </section>
  );
}
