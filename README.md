# SeatScout 🎟️

Find the **best deals on live event tickets** — a Gametime-style aggregator that
compares prices across brokers, scores every event, and lets you build a
watchlist with price alerts. Sports, concerts, comedy, theater.

Built on **real data** from the [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/).
**No mock feeds** — if a broker isn't connected, it simply doesn't show numbers.

---

## ✨ Features

- **Live event search** — keyword, city, date range, category, and max-price
  filters, all backed by the Ticketmaster Discovery API.
- **Cross-broker price comparison** — a pluggable broker layer (Ticketmaster
  live today, SeatGeek ready, more behind the same interface) so you see the
  cheapest get-in price and how much you save.
- **Transparent Deal Score** — every event gets a 0–100 score with a
  plain-language reason. No black box (see [How deal scoring works](#-how-deal-scoring-works)).
- **Deal of the Day** — the single best-value event surfaced up top.
- **Watchlist + price alerts** — save events and set a target price, stored
  locally (no account required).
- **Customizable & friendly** — sortable, filterable, responsive, with dark
  mode and a fast skeleton-loading UI.

---

## 🚀 Quick start

```bash
npm install
cp .env.example .env          # then add your Ticketmaster key (see below)
npm run dev                   # http://localhost:3000
```

The app runs without a key, but the event feed needs a Ticketmaster **Consumer
Key** to return data (you'll see an in-app notice prompting for it until it's
set).

---

## 🔑 Getting Ticketmaster API access (required)

The Discovery API is free but **gated behind your own developer account** —
Ticketmaster issues the key to *you* after you accept their terms, so it can't
be provisioned on your behalf. It takes ~2 minutes:

1. Go to **<https://developer.ticketmaster.com/>** and click **Sign Up** (top
   right). Create an account / sign in.
2. Open **[Getting Started](https://developer.ticketmaster.com/products-and-docs/apis/getting-started/)**
   and register/confirm an app. A default app is created automatically on
   signup.
3. Go to **My Apps** (under your account menu) and copy the **Consumer Key**.
   That string is your API key.
4. Add it to your environment:

   ```bash
   # .env
   TICKETMASTER_API_KEY=your_consumer_key_here
   ```

5. Restart `npm run dev`. Live events appear immediately.

> **Tip — quick test:** paste your key into this URL in a browser:
> `https://app.ticketmaster.com/discovery/v2/events.json?apikey=YOUR_KEY&keyword=lakers`
> A JSON response with `_embedded.events` means your key works.

> **Rate limits:** the default tier allows **5 requests/sec and 5,000
> requests/day**. SeatScout caches API responses for 120s to stay well under
> that.

### Running inside a restricted network / sandbox

Some managed environments block outbound traffic by allow-list. If you see
*"Couldn't reach Ticketmaster"*, the host **`app.ticketmaster.com`** needs to be
allowed by your network policy (and `api.seatgeek.com` if you enable SeatGeek).
A normal local machine or a Vercel deployment has open egress and just works.

---

## 🧱 Architecture

```
src/
  app/
    page.tsx               Dashboard (search, filters, grid, deal of the day)
    events/[id]/page.tsx   Event detail + cross-broker comparison
    watchlist/page.tsx     Saved events + price alerts
    api/events/            Route handlers (search + detail)
  lib/
    ticketmaster/client.ts Typed Discovery API client + mappers
    brokers/               Pluggable price providers (Ticketmaster, SeatGeek)
      provider.ts          The OfferProvider interface — add a broker here
    aggregate.ts           Combine event + offers, compute savings & scores
    dealScore.ts           Deal-scoring engine (cross-broker + category-relative)
    types.ts               Honest domain model (events + price ranges + offers)
  components/              Cards, filters, deal badges, broker table, alerts…
  hooks/                   Local-storage watchlist + price-alert hooks
```

### Adding a broker

Implement `OfferProvider` (one `getOffer(event)` method that returns a
`BrokerOffer | null`) and register it in `src/lib/brokers/index.ts`. The
aggregation engine, deal scoring, and the entire UI pick it up automatically —
the cross-broker Deal Score activates the moment a second broker returns prices.

SeatGeek is already wired: set `SEATGEEK_CLIENT_ID` (from
<https://platform.seatgeek.com/>) and it goes live.

---

## 📊 How deal scoring works

Every event gets a 0–100 score, computed from **real prices only**:

- **Cross-broker mode** (when ≥2 brokers report a price): rewards the cheapest
  broker by how much it undercuts the next-cheapest. This is the true
  apples-to-apples deal signal.
- **Category-relative mode** (Ticketmaster only): compares the event's get-in
  price to the *median* get-in price of other events in the same category
  currently loaded. Cheaper-than-peers ranks higher.

Labels: **Great** (75+), **Good** (58+), **Fair** (42+), **Above market** (<42).
The detail page always shows the reason behind the score.

---

## 🛣️ Roadmap

- Real cross-broker resale inventory via partner APIs (StubHub, Vivid Seats,
  Gametime, TickPick) — all slot into the existing `OfferProvider` interface.
- Seat-level maps and per-section pricing.
- Server-side price-alert delivery (email/push) backed by a scheduled price poll.

---

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start the dev server                 |
| `npm run build`  | Production build                     |
| `npm start`      | Serve the production build           |
| `npm run lint`   | Lint                                 |
| `npm run typecheck` | Type-check without emitting       |

Data from the Ticketmaster Discovery API. SeatScout is not affiliated with
Ticketmaster or any broker; prices/availability are provided by the brokers and
may change at checkout.
