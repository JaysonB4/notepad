import type { JSONContent } from "@tiptap/react";

// Blocks that hold a line of text. Lists, quotes and the like are containers around these.
const TEXT_BLOCKS = new Set(["paragraph", "heading", "codeBlock"]);

function blockText(node: JSONContent): string {
  return (node.content ?? [])
    .map((child) => (child.type === "hardBreak" ? "\n" : (child.text ?? "")))
    .join("");
}

/**
 * The title of a note: its first non-empty line. When the note starts with a list, that is the
 * first list item, not the whole list run together.
 */
export function titleFromContent(doc: JSONContent | null | undefined): string {
  if (!doc) return "";

  let title = "";
  const visit = (node: JSONContent): boolean => {
    if (TEXT_BLOCKS.has(node.type ?? "")) {
      const line = blockText(node)
        .split("\n")
        .map((s) => s.trim())
        .find(Boolean);
      if (line) {
        title = line;
        return true;
      }
      return false;
    }
    return (node.content ?? []).some((child) => visit(child));
  };

  visit(doc);
  return title.slice(0, 80);
}
