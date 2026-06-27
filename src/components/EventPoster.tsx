import { CATEGORY_META, gradientFor } from "@/lib/format";
import type { EventCategory } from "@/lib/types";

/**
 * Event image with a deterministic gradient + emoji fallback when Ticketmaster
 * doesn't return artwork. Uses a plain <img> (Discovery images come from many
 * CDN hosts, so next/image domain config would need constant maintenance).
 */
export function EventPoster({
  src,
  alt,
  category,
  seed,
  className = "",
}: {
  src: string | null;
  alt: string;
  category: EventCategory;
  seed: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center text-4xl ${className}`}
      style={{ background: gradientFor(seed) }}
      aria-label={alt}
    >
      {CATEGORY_META[category].emoji}
    </div>
  );
}
