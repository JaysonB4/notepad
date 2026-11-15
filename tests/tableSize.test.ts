import { describe, expect, it } from "vitest";
import { MAX_COLS, MAX_ROWS, clampSize } from "@/lib/tableSize";

describe("clampSize", () => {
  it("keeps values inside the limits", () => {
    expect(clampSize(3, MAX_ROWS)).toBe(3);
    expect(clampSize(0, MAX_ROWS)).toBe(1);
    expect(clampSize(-4, MAX_COLS)).toBe(1);
    expect(clampSize(500, MAX_ROWS)).toBe(MAX_ROWS);
    expect(clampSize(99, MAX_COLS)).toBe(MAX_COLS);
  });

  it("rounds to whole rows and columns", () => {
    expect(clampSize(2.6, MAX_COLS)).toBe(3);
  });

  it("treats empty or invalid input as the minimum", () => {
    expect(clampSize(NaN, MAX_ROWS)).toBe(1);
    expect(clampSize(Infinity, MAX_ROWS)).toBe(1);
  });
});
