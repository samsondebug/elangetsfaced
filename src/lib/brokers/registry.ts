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
};

export const BROKER_LIST: Broker[] = Object.values(BROKERS);

export function getBroker(id: BrokerId): Broker {
  return BROKERS[id];
}
