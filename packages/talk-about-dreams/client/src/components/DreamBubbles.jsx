import React from "react";
import { WLDriftingShapes } from "../libraries/Web-Legos/components/Backgrounds";
import "../assets/style/dreamBubbles.css";

/* Soft, translucent speech and thought bubbles: the shapes for the homepage splash's drifting layer. */

const SpeechBubble = () => (
  <svg viewBox="0 0 64 56" aria-hidden="true" focusable="false">
    <path d="M14 4h36a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10H28l-11 10 2-10h-5A10 10 0 0 1 4 30V14A10 10 0 0 1 14 4z" />
    <circle className="dot" cx="22" cy="22" r="2.4" />
    <circle className="dot" cx="32" cy="22" r="2.4" />
    <circle className="dot" cx="42" cy="22" r="2.4" />
  </svg>
);

const ThoughtBubble = () => (
  <svg viewBox="0 0 64 60" aria-hidden="true" focusable="false">
    <path d="M18 38a11 11 0 0 1-3-21.5A13 13 0 0 1 38 9a12 12 0 0 1 17 9.5A10 10 0 0 1 52 38z" />
    <circle cx="16" cy="46" r="4" />
    <circle cx="9" cy="54" r="2.5" />
  </svg>
);

/** The bubble shapes, for WLDriftingShapes (style them with the `dream-bubbles` class): two speech bubbles to every thought bubble. */
export const DREAM_BUBBLE_SHAPES = [<SpeechBubble />, <SpeechBubble />, <ThoughtBubble />];

/**
 * Dream bubbles rising slowly behind the homepage splash, like falling leaves in reverse.
 * Place it as the first child of the splash section (`.splash` sets `isolation: isolate`).
 */
export default function DreamBubbles() {
  return <WLDriftingShapes shapes={DREAM_BUBBLE_SHAPES} direction="up" className="dream-bubbles" />;
}
