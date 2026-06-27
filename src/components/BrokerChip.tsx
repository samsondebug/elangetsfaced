import { getBroker } from "@/lib/brokers/registry";
import type { BrokerId } from "@/lib/types";

export function BrokerChip({ id }: { id: BrokerId }) {
  const broker = getBroker(id);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: broker.color }}
    >
      {broker.name}
    </span>
  );
}

export function BrokerDot({ id }: { id: BrokerId }) {
  const broker = getBroker(id);
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: broker.color }}
      title={broker.name}
    />
  );
}
