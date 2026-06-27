import { ImageResponse } from "next/og";

// Branded social link-preview card (1200×630). Rendered by Next.js for any
// page that doesn't define its own, so pasting the URL anywhere looks polished.
export const runtime = "edge";
export const alt = "SeatScout — find the best ticket deals across brokers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b1220 0%, #137cf5 100%)",
          color: "white",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#137cf5",
              fontSize: 44,
            }}
          >
            🎟️
          </div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>SeatScout</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            Find the best seats
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            for <span style={{ color: "#8bd5ff" }}>less.</span>
          </div>
          <div style={{ fontSize: 32, color: "#cbd5e1", marginTop: 16 }}>
            Compare live ticket prices across brokers · scored deals · price alerts
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 26 }}>
          {["Sports", "Concerts", "Comedy", "Theater"].map((t) => (
            <div
              key={t}
              style={{
                background: "rgba(255,255,255,0.12)",
                padding: "10px 22px",
                borderRadius: 999,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
