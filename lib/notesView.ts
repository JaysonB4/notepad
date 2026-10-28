import type { Note } from "./storage";

/** Newest first, filtered by the search text (matched against the note's plain text). */
export function visibleSorted(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  if (!q) return sorted;
  return sorted.filter((n) => n.text.toLowerCase().includes(q));
}
