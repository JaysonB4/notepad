/** Largest table the editor will insert, in rows and columns. */
export const MAX_ROWS = 20;
export const MAX_COLS = 10;

/** Keeps a typed number within the table limits. Anything that isn't a number counts as the minimum. */
export function clampSize(value: number, max: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(max, Math.max(1, Math.round(value)));
}
