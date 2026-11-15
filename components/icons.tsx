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
      <path d="M4 4.5h.01M4 12h.01M4 19.5h.01" strokeWidth={3.4} />
      <path d="M10 4.5h11M10 12h11M10 19.5h11" />
    </svg>
  );
}

/** "1" and "2" next to two lines of text. */
export function NumberedListIcon() {
  return (
    <svg {...svgProps} strokeWidth={1.8}>
      <path d="M3.6 6.3 5.4 5v5M3.6 10h3.6" />
      <path d="M3.8 14.6a1.7 1.7 0 0 1 3.3.4c0 1.5-3.3 2.2-3.3 4.2h3.5" />
      <path d="M11 6h10M11 18h10" strokeWidth={2} />
    </svg>
  );
}

/** A curved arrow pointing back to the left. */
export function UndoIcon() {
  return (
    <svg {...svgProps}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

/** A curved arrow pointing forward to the right. */
export function RedoIcon() {
  return (
    <svg {...svgProps}>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}

/** A grid of rows and columns: a table. */
export function TableIcon() {
  return (
    <svg {...svgProps} strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9.3h18M3 14.7h18M9 4v16M15 4v16" />
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
