import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "About — SeatScout",
  description:
    "How SeatScout aggregates live ticket data and scores deals across brokers.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft size={16} /> Back to search
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">About SeatScout</h1>
        <p className="text-slate-500 dark:text-slate-400">
          SeatScout is a ticket-deal aggregator. It pulls live event data,
          compares prices across brokers, and scores every event so you can find
          the best value fast — without tabbing between a dozen ticket sites.
        </p>
      </header>

      <Section title="Where the data comes from">
        Events and prices are pulled live from the{" "}
        <a
          className="font-medium text-brand-600 hover:underline"
          href="https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ticketmaster Discovery API
        </a>
        . There are no mock or invented prices anywhere in the app — if a broker
        isn&apos;t connected, it simply doesn&apos;t display a number. Additional
        marketplaces (SeatGeek and more) plug into the same broker interface, and
        the moment a second broker reports prices the comparison becomes a true
        apples-to-apples cross-broker view.
      </Section>

      <Section title="How the Deal Score works">
        Every event gets a 0–100 score derived only from real prices:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Cross-broker mode</strong> — when two or more brokers report
            a price, the score rewards the cheapest broker by how far it
            undercuts the next-cheapest.
          </li>
          <li>
            <strong>Category-relative mode</strong> — with a single broker, the
            score compares the event&apos;s get-in price to the median price of
            other events in the same category currently loaded.
          </li>
        </ul>
        The detail page always shows the reason behind the score — no black box.
      </Section>

      <Section title="Privacy">
        Your watchlist and price alerts live entirely in your browser&apos;s
        local storage. No account, no tracking, nothing leaves your device.
      </Section>

      <p className="text-xs text-slate-400">
        SeatScout is not affiliated with Ticketmaster or any broker. Prices and
        availability are provided by the brokers and may change at checkout.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}
