import type { Broker, BrokerId } from "@/lib/types";

/** Brokers SeatScout can aggregate. Ticketmaster is live now; SeatGeek wires in
 *  the moment a SEATGEEK_CLIENT_ID is provided. */
export const BROKERS: Record<BrokerId, Broker> = {
  ticketmaster: {
    id: "ticketmaster",
    name: "Ticketmaster",
    short: "TM",
    color: "#026cdf",
    allInPricing: false,
  },
  seatgeek: {
    id: "seatgeek",
    name: "SeatGeek",
    short: "SG",
    color: "#ff5b49",
    allInPricing: true,
  },
  stubhub: { id: "stubhub", name: "StubHub", short: "SH", color: "#3a0a59", allInPricing: false },
  vividseats: { id: "vividseats", name: "Vivid Seats", short: "VS", color: "#1f6feb", allInPricing: false },
  gametime: { id: "gametime", name: "Gametime", short: "GT", color: "#19c37d", allInPricing: true },
  tickpick: { id: "tickpick", name: "TickPick", short: "TP", color: "#f5a623", allInPricing: true },
  viagogo: { id: "viagogo", name: "viagogo", short: "VG", color: "#ff6b00", allInPricing: false },
  dice: { id: "dice", name: "DICE", short: "DC", color: "#111827", allInPricing: true },
  eventbrite: { id: "eventbrite", name: "Eventbrite", short: "EB", color: "#f05537", allInPricing: false },
  axs: { id: "axs", name: "AXS", short: "AX", color: "#00b4e3", allInPricing: false },
};

export const BROKER_LIST: Broker[] = Object.values(BROKERS);

export function getBroker(id: BrokerId): Broker {
  return BROKERS[id];
}
