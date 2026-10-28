import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TabIndent } from "@/lib/tabIndent";

let editor: Editor | null = null;

function makeEditor(content: JSONContent) {
  const element = document.createElement("div");
  document.body.appendChild(element);
  editor = new Editor({
    element,
    extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true }), TabIndent],
    content,
  });
  return editor;
}

function press(key: "Tab" | "Shift+Tab" | "Escape") {
  const shift = key === "Shift+Tab";
  const event = new KeyboardEvent("keydown", {
    key: shift ? "Tab" : key,
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  });
  editor!.view.dom.dispatchEvent(event);
  return event.defaultPrevented;
}

const para = (value: string): JSONContent => ({
  type: "paragraph",
  content: value ? [{ type: "text", text: value }] : [],
});

/** Text of every top-level block, in order. */
function blocks(): string[] {
  return editor!.getJSON().content!.map((node) => (node.content ?? []).map((c) => (c as JSONContent).text ?? "").join(""));
}

/** Number of list containers nested inside another list. */
function nestedListCount(): number {
  let count = 0;
  editor!.state.doc.descendants((node) => {
    if (node.type.name === "bulletList" || node.type.name === "taskList") {
      node.descendants((child) => {
        if (child.type.name === "bulletList" || child.type.name === "taskList") count++;
        return true;
      });
    }
    return true;
  });
  return count;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.innerHTML = "";
});

describe("Tab in plain text", () => {
  beforeEach(() => {
    makeEditor({ type: "doc", content: [para("abc")] });
    editor!.commands.setTextSelection(4); // after the "c"
  });

  it("inserts a tab at the cursor and keeps the default key action off", () => {
    expect(press("Tab")).toBe(true);
    expect(blocks()).toEqual(["abc\t"]);
  });

  it("removes the tab just before the cursor with Shift+Tab", () => {
    press("Tab");
    expect(press("Shift+Tab")).toBe(true);
    expect(blocks()).toEqual(["abc"]);
  });

  it("does nothing on Shift+Tab when there is no tab to remove", () => {
    press("Shift+Tab");
    expect(blocks()).toEqual(["abc"]);
  });
});

describe("Tab with a selection", () => {
  it("indents every selected line and leaves the text otherwise unchanged", () => {
    makeEditor({ type: "doc", content: [para("one"), para("two"), para("three")] });
    editor!.commands.selectAll();
    press("Tab");
    expect(blocks()).toEqual(["\tone", "\ttwo", "\tthree"]);
  });

  it("outdents every selected line with Shift+Tab", () => {
    makeEditor({ type: "doc", content: [para("\tone"), para("two"), para("\tthree")] });
    editor!.commands.selectAll();
    press("Shift+Tab");
    expect(blocks()).toEqual(["one", "two", "three"]);
  });
});

describe("Tab in lists", () => {
  const bullets = (...items: string[]): JSONContent => ({
    type: "doc",
    content: [
      {
        type: "bulletList",
        content: items.map((item) => ({ type: "listItem", content: [para(item)] })),
      },
    ],
  });

  it("nests a bullet item under the one above it", () => {
    makeEditor(bullets("Milk", "Eggs"));
    editor!.commands.setTextSelection(editor!.state.doc.content.size - 2); // inside "Eggs"
    expect(nestedListCount()).toBe(0);

    expect(press("Tab")).toBe(true);
    expect(nestedListCount()).toBe(1);
  });

  it("lifts a nested item back out with Shift+Tab", () => {
    makeEditor(bullets("Milk", "Eggs"));
    editor!.commands.setTextSelection(editor!.state.doc.content.size - 2);
    press("Tab");
    press("Shift+Tab");
    expect(nestedListCount()).toBe(0);
  });

  it("keeps focus in the editor when the first item cannot nest", () => {
    makeEditor(bullets("Milk"));
    editor!.commands.setTextSelection(2); // inside "Milk"
    expect(press("Tab")).toBe(true);
    expect(nestedListCount()).toBe(0);
    expect(editor!.state.doc.textContent).toBe("Milk");
  });

  it("nests checklist items too", () => {
    makeEditor({
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            { type: "taskItem", attrs: { checked: false }, content: [para("Buy milk")] },
            { type: "taskItem", attrs: { checked: false }, content: [para("Buy eggs")] },
          ],
        },
      ],
    });
    editor!.commands.setTextSelection(editor!.state.doc.content.size - 2); // inside "Buy eggs"
    press("Tab");
    expect(nestedListCount()).toBe(1);
  });
});
