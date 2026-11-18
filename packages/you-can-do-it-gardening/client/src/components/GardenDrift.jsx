import React from "react";
import { WLDriftingShapes } from "../libraries/Web-Legos/components/Backgrounds";

/* Leaves, hydrangea florets and loose petals: the shapes for the homepage hero's drifting layer. */

// A soft shadow so pale shapes still read over the blurred hydrangea photo.
const lift = { filter: "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.25))" };

const Leaf = ({ color, vein }) => (
  <svg viewBox="0 0 40 60" aria-hidden="true" focusable="false" style={lift}>
    <path d="M20 2C34 14 37 38 20 58C3 38 6 14 20 2z" fill={color} />
    <path d="M20 8V54M20 22l-7-5M20 22l7-5M20 34l-8-5M20 34l8-5M20 45l-6-4M20 45l6-4" stroke={vein} strokeWidth="1.4" strokeLinecap="round" fill="none" />
  </svg>
);

const Floret = ({ petal, center }) => (
  <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" style={lift}>
    {[0, 90, 180, 270].map((angle) => (
      <ellipse key={angle} cx="20" cy="10" rx="7.5" ry="9" fill={petal} transform={`rotate(${angle} 20 20)`} />
    ))}
    <circle cx="20" cy="20" r="3.6" fill={center} />
  </svg>
);

const Petal = ({ color }) => (
  <svg viewBox="0 0 24 32" aria-hidden="true" focusable="false" style={lift}>
    <path d="M12 2C20 8 22 20 12 30C2 20 4 8 12 2z" fill={color} />
  </svg>
);

/** The leaf and flower shapes, for WLDriftingShapes. */
export const GARDEN_SHAPES = [
  <Leaf color="#5f8f45" vein="#a9cf86" />,
  <Leaf color="#86b35a" vein="#cfe6a8" />,
  <Floret petal="#f4f7ff" center="#d6e46f" />,
  <Floret petal="#9fb6f5" center="#e4ef9a" />,
  <Petal color="#c6d4fb" />,
];

/**
 * Leaves and flowers drifting down over the homepage hero, like falling leaves.
 * Place it as the first child of the hero (`.background-image`).
 */
export default function GardenDrift() {
  return <WLDriftingShapes shapes={GARDEN_SHAPES} direction="down" size={[24, 52]} className="garden-drift" />;
}
