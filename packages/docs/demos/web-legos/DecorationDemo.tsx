// @ts-nocheck — web-legos JSX has no TS types; demos are presentational only.
"use client";

import { FloatingIsland, ThreeDots } from "../../../web-legos/components/Decoration.jsx";

export function FloatingIslandDemo() {
  return (
    <div style={{ padding: "1rem 0", background: "#1c1a16", borderRadius: 6 }}>
      <FloatingIsland color="#d8ebe4" width="70%" />
    </div>
  );
}

export function ThreeDotsDemo() {
  return (
    <div style={{ maxWidth: 320 }}>
      <ThreeDots left right color="#0f5c4c" />
    </div>
  );
}
