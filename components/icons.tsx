// Toolbar icons: 24x24 grid, 2px round strokes, drawn in currentColor.

const svgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Three bullets, each with a line of text. */
export function BulletListIcon() {
  return (
    <svg {...svgProps}>
      {/* Zero-length strokes with round caps draw the dots. */}
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={3.4} />
      <path d="M10 6h11M10 12h11M10 18h11" />
    </svg>
  );
}

/** "1" and "2" next to two lines of text. */
export function NumberedListIcon() {
  return (
    <svg {...svgProps} strokeWidth={1.8}>
      <path d="M3.6 6.3 5.4 5v5M3.6 10h3.6" />
      <path d="M3.8 14.6a1.7 1.7 0 0 1 3.3.4c0 1.5-3.3 2.2-3.3 4.2h3.5" />
      <path d="M11 7.5h10M11 16.5h10" strokeWidth={2} />
    </svg>
  );
}

/** A ticked box and an empty box, each with a line of text. */
export function ChecklistIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="6.5" height="6.5" rx="1.4" />
      <path d="m4.7 7.3 1.4 1.4 2-2.4" strokeWidth={1.8} />
      <rect x="3" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <path d="M13 7.3h8M13 16.8h8" />
    </svg>
  );
}
