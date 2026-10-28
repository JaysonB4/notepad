import type { JSONContent } from "@tiptap/react";
import { titleFromContent } from "./title";

export type Note = {
  id: string;
  title: string;
  /** Plain-text version of the note, used for search. */
  text: string;
  /** TipTap document JSON. */
  content: JSONContent | null;
  updatedAt: number;
};

export type StoredState = {
  notes: Note[];
  activeId: string | null;
};

const STORAGE_KEY = "notepad:v1";

export function createNote(): Note {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "",
    text: "",
    content: null,
    updatedAt: Date.now(),
  };
}

export function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (Array.isArray(parsed.notes) && parsed.notes.length > 0) {
        // Recompute titles so notes saved before titles used only the first line are corrected.
        const notes = parsed.notes.map((n) =>
          n.content ? { ...n, title: titleFromContent(n.content) } : n,
        );
        const activeId =
          parsed.activeId && notes.some((n) => n.id === parsed.activeId)
            ? parsed.activeId
            : notes[0].id;
        return { notes, activeId };
      }
    }
  } catch {
    // Corrupt or unavailable storage: fall through to a fresh state.
  }
  const first = createNote();
  return { notes: [first], activeId: first.id };
}

const SIDEBAR_KEY = "notepad:sidebar";

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "collapsed";
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "open");
  } catch {
    // Storage blocked: the sidebar still toggles for this visit.
  }
}

export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (e.g. private mode). Nothing useful to do here.
  }
}
