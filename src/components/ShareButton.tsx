"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

/** Native share sheet where supported, clipboard copy everywhere else. */
export function ShareButton({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && "share" in nav) {
      try {
        await nav.share({ title, text: text ?? title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await nav?.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <button onClick={onShare} className="btn-ghost w-full">
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
