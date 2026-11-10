import { ImageResponse } from "next/og";

export const alt =
  "Still Open — which of the roles you applied to are already closed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf9f6",
          color: "#16150f",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              letterSpacing: "-0.03em",
              fontWeight: 600,
            }}
          >
            still_open()
          </div>
          {/* Satori needs a single child here, so this stays one string. */}
          <div
            style={{
              fontSize: 36,
              lineHeight: 1.35,
              marginTop: 24,
              maxWidth: 900,
              color: "#44423a",
            }}
          >
            You applied. Then nothing. Some of those roles are already closed and
            nobody told you.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, color: "#6d6a5e", letterSpacing: "0.1em" }}>
              STILL OPEN
            </div>
            <div style={{ fontSize: 64, color: "#2f6b45" }}>13</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, color: "#6d6a5e", letterSpacing: "0.1em" }}>
              CLOSED
            </div>
            <div style={{ fontSize: 64, color: "#a03a22" }}>4</div>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 22,
              color: "#6d6a5e",
            }}
          >
            built on the a16z speedrun talent network API
          </div>
        </div>
      </div>
    ),
    size,
  );
}
