import React from "react";
import "../assets/style/dreamBubbles.css";

/**
 * Soft, translucent speech bubbles that drift slowly upward behind the
 * splash content — falling leaves in reverse. Purely decorative.
 *
 * The layout is computed once at module load so re-renders of the
 * homepage don't reshuffle (and restart) every bubble.
 */

const BUBBLE_COUNT = 11;

// Small deterministic PRNG so the layout is stable across reloads too.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261118);
const between = (min, max) => min + rand() * (max - min);

const BUBBLES = Array.from({ length: BUBBLE_COUNT }, (_, i) => {
  const duration = between(22, 36);
  return {
    // Spread bubbles across the width in lanes, with jitter, so they don't clump.
    left: ((i + between(0.15, 0.85)) / BUBBLE_COUNT) * 100,
    size: between(36, 76),
    duration,
    // Negative delay = already mid-flight on first paint, so the page never looks empty.
    delay: -between(0, duration),
    swayDuration: between(5, 9),
    sway: between(10, 26),
    tilt: between(-10, 10),
    opacity: between(0.5, 0.85),
    flip: rand() < 0.5,
    variant: rand() < 0.35 ? "thought" : "speech",
  };
});

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

/**
 * Decorative layer of slowly rising speech and thought bubbles. Place it as the first child of a
 * `position: relative; isolation: isolate` section; it fills the section behind the content.
 * @param {number} [riseDistance=960] - How far (px) each bubble travels; roughly the section's height.
 */
export default function DreamBubbles({ riseDistance = 960 }) {
  return (
    <div className="dream-bubbles" aria-hidden="true" style={{ "--rise-distance": `${riseDistance}px` }}>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="dream-bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            "--rise-duration": `${b.duration}s`,
            "--rise-delay": `${b.delay}s`,
            "--sway-duration": `${b.swayDuration}s`,
            "--sway": `${b.sway}px`,
            "--tilt": `${b.tilt}deg`,
            "--peak-opacity": b.opacity,
          }}
        >
          <span className={`dream-bubble-inner${b.flip ? " flip" : ""}`}>
            {b.variant === "thought" ? <ThoughtBubble /> : <SpeechBubble />}
          </span>
        </span>
      ))}
    </div>
  );
}
