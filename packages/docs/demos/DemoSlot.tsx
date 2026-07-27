import type { ReactElement } from "react";
import { WavesDemo } from "./web-legos/WavesDemo";
import {
  FloatingIslandDemo,
  ThreeDotsDemo,
} from "./web-legos/DecorationDemo";
import { IconsSocialDemo } from "./web-legos/IconsSocialDemo";

const DEMOS: Record<string, () => ReactElement> = {
  waves: WavesDemo,
  "floating-island": FloatingIslandDemo,
  "three-dots": ThreeDotsDemo,
  "icons-social": IconsSocialDemo,
};

export function DemoSlot({ demoId }: { demoId: string }) {
  const Demo = DEMOS[demoId];
  if (!Demo) return null;
  return (
    <div className="demo-slot">
      <h3>Live demo</h3>
      <Demo />
    </div>
  );
}
