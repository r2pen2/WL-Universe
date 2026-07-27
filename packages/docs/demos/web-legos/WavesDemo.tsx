// @ts-nocheck — web-legos JSX has no TS types; demos are presentational only.
"use client";

import { WaveTop, WaveBottom, Swoosh } from "../../../web-legos/components/Waves.jsx";

export function WavesDemo() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ background: "#0f5c4c", borderRadius: 6, overflow: "hidden" }}>
        <WaveTop color="#f6f4ef" />
      </div>
      <div style={{ background: "#1c1a16", borderRadius: 6, overflow: "hidden" }}>
        <Swoosh color="#0f5c4c" />
      </div>
      <div style={{ background: "#d8ebe4", borderRadius: 6, overflow: "hidden" }}>
        <WaveBottom color="#0f5c4c" />
      </div>
    </div>
  );
}
