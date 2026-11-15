/**
 * Keyboard shortcuts for the editor, written the way TipTap expects them.
 * "Mod" means Ctrl on Windows and Linux, and Cmd on Mac.
 *
 * Most of these are TipTap's own defaults. The table shortcut is added in Editor.tsx.
 * Tooltips read from this file, so they always match the keys that work.
 */
export const SHORTCUTS = {
  bold: "Mod-b",
  italic: "Mod-i",
  strike: "Mod-Shift-s",
  heading1: "Mod-Alt-1",
  heading2: "Mod-Alt-2",
  bulletList: "Mod-Shift-8",
  orderedList: "Mod-Shift-7",
  checklist: "Mod-Shift-9",
  quote: "Mod-Shift-b",
  codeBlock: "Mod-Alt-c",
  table: "Mod-Alt-t",
  undo: "Mod-z",
  redo: "Mod-Shift-z",
} as const;

export function isApplePlatform(platform: string): boolean {
  return /Mac|iPhone|iPad|iPod/.test(platform);
}

/** "Mod-Shift-8" becomes "Ctrl+Shift+8" on Windows and Linux, and "Cmd+Shift+8" on Mac. */
export function shortcutLabel(keys: string, apple: boolean): string {
  return keys
    .split("-")
    .map((part) => {
      if (part === "Mod") return apple ? "Cmd" : "Ctrl";
      if (part === "Alt") return apple ? "Option" : "Alt";
      if (part === "Shift") return "Shift";
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join("+");
}

/** Tooltip text such as "Bold (Ctrl+B)". */
export function tooltip(name: string, keys: string, apple: boolean): string {
  return `${name} (${shortcutLabel(keys, apple)})`;
}
