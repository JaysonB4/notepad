import { describe, expect, it } from "vitest";
import { visibleSorted } from "@/lib/notesView";
import type { Note } from "@/lib/storage";

const make = (id: string, text: string, updatedAt: number): Note => ({ id, title: text, text, content: null, updatedAt });

describe("visibleSorted", () => {
  const notes = [make("a", "Milk and eggs", 1), make("b", "Trip plans", 3), make("c", "Milk for the cat", 2)];

  it("sorts newest first", () => {
    expect(visibleSorted(notes, "").map((n) => n.id)).toEqual(["b", "c", "a"]);
  });

  it("filters on the plain text, ignoring case and surrounding spaces", () => {
    expect(visibleSorted(notes, "  MILK ").map((n) => n.id)).toEqual(["c", "a"]);
  });

  it("returns nothing when no note matches", () => {
    expect(visibleSorted(notes, "zebra")).toEqual([]);
  });

  it("does not change the order of the array it is given", () => {
    const copy = [...notes];
    visibleSorted(notes, "");
    expect(notes).toEqual(copy);
  });
});
