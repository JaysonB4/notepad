import { describe, expect, it } from "vitest";
import type { JSONContent } from "@tiptap/react";
import { titleFromContent } from "@/lib/title";

const text = (value: string): JSONContent => ({ type: "text", text: value });
const paragraph = (value: string): JSONContent => ({ type: "paragraph", content: [text(value)] });
const doc = (...content: JSONContent[]): JSONContent => ({ type: "doc", content });

describe("titleFromContent", () => {
  it("returns an empty title for no document", () => {
    expect(titleFromContent(null)).toBe("");
    expect(titleFromContent(undefined)).toBe("");
  });

  it("uses the first paragraph", () => {
    expect(titleFromContent(doc(paragraph("Groceries"), paragraph("Milk")))).toBe("Groceries");
  });

  it("skips empty lines at the top", () => {
    expect(titleFromContent(doc(paragraph(""), paragraph("   "), paragraph("Plans")))).toBe("Plans");
  });

  it("trims surrounding whitespace", () => {
    expect(titleFromContent(doc(paragraph("  Trip  ")))).toBe("Trip");
  });

  it("uses only the first item of a bullet list", () => {
    const list: JSONContent = {
      type: "bulletList",
      content: [
        { type: "listItem", content: [paragraph("First item")] },
        { type: "listItem", content: [paragraph("Second item")] },
      ],
    };
    expect(titleFromContent(doc(list))).toBe("First item");
  });

  it("uses only the first item of a numbered list", () => {
    const list: JSONContent = {
      type: "orderedList",
      content: [{ type: "listItem", content: [paragraph("Step one")] }, { type: "listItem", content: [paragraph("Step two")] }],
    };
    expect(titleFromContent(doc(list))).toBe("Step one");
  });

  it("uses the first checklist item, including nested checklists", () => {
    const checklist: JSONContent = {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [paragraph("Buy milk"), { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [paragraph("Whole")] }] }],
        },
        { type: "taskItem", attrs: { checked: true }, content: [paragraph("Buy eggs")] },
      ],
    };
    expect(titleFromContent(doc(checklist))).toBe("Buy milk");
  });

  it("uses the first line of a paragraph with a soft line break", () => {
    const withBreak: JSONContent = {
      type: "paragraph",
      content: [text("Line one"), { type: "hardBreak" }, text("Line two")],
    };
    expect(titleFromContent(doc(withBreak))).toBe("Line one");
  });

  it("cuts the title at 80 characters", () => {
    expect(titleFromContent(doc(paragraph("x".repeat(200))))).toHaveLength(80);
  });

  it("returns an empty title for a document with no text", () => {
    expect(titleFromContent(doc({ type: "paragraph" }))).toBe("");
  });
});
