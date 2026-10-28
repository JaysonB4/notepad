import { beforeEach, describe, expect, it } from "vitest";
import type { JSONContent } from "@tiptap/react";
import { loadSidebarCollapsed, loadState, saveSidebarCollapsed, saveState, type Note } from "@/lib/storage";

const STORAGE_KEY = "notepad:v1";

const text = (value: string): JSONContent => ({ type: "text", text: value });
const bulletDoc = (...items: string[]): JSONContent => ({
  type: "doc",
  content: [
    {
      type: "bulletList",
      content: items.map((item) => ({ type: "listItem", content: [{ type: "paragraph", content: [text(item)] }] })),
    },
  ],
});

function note(id: string, title: string, content: JSONContent | null): Note {
  return { id, title, text: title, content, updatedAt: 1 };
}

beforeEach(() => {
  localStorage.clear();
});

describe("loadState", () => {
  it("creates one empty note when nothing is saved", () => {
    const state = loadState();
    expect(state.notes).toHaveLength(1);
    expect(state.activeId).toBe(state.notes[0].id);
    expect(state.notes[0].content).toBeNull();
  });

  it("creates one empty note when the saved data is not valid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadState().notes).toHaveLength(1);
  });

  it("creates one empty note when the saved list is empty", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: [], activeId: null }));
    expect(loadState().notes).toHaveLength(1);
  });

  it("restores saved notes and the active note", () => {
    const saved = { notes: [note("a", "A", null), note("b", "B", null)], activeId: "b" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    expect(loadState()).toEqual({ notes: saved.notes, activeId: "b" });
  });

  it("falls back to the first note when the active note no longer exists", () => {
    const saved = { notes: [note("a", "A", null)], activeId: "gone" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    expect(loadState().activeId).toBe("a");
  });

  it("fixes titles saved before titles used only the first line", () => {
    // Older saves stored every list item run together as the title.
    const saved = { notes: [note("a", "AlphaBeta", bulletDoc("Alpha", "Beta"))], activeId: "a" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    expect(loadState().notes[0].title).toBe("Alpha");
  });
});

describe("saveState", () => {
  it("round-trips through loadState", () => {
    const state = { notes: [note("a", "Hello", bulletDoc("Hello"))], activeId: "a" };
    saveState(state);
    expect(loadState()).toEqual(state);
  });
});

describe("sidebar preference", () => {
  it("defaults to open", () => {
    expect(loadSidebarCollapsed()).toBe(false);
  });

  it("remembers a collapsed sidebar", () => {
    saveSidebarCollapsed(true);
    expect(loadSidebarCollapsed()).toBe(true);
  });

  it("remembers an open sidebar again after it was collapsed", () => {
    saveSidebarCollapsed(true);
    saveSidebarCollapsed(false);
    expect(loadSidebarCollapsed()).toBe(false);
  });
});
