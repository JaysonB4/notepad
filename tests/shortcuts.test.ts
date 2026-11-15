import { describe, expect, it } from "vitest";
import { SHORTCUTS, isApplePlatform, shortcutLabel, tooltip } from "@/lib/shortcuts";

describe("shortcutLabel", () => {
  it("shows Ctrl on Windows and Linux", () => {
    expect(shortcutLabel("Mod-b", false)).toBe("Ctrl+B");
    expect(shortcutLabel("Mod-Shift-8", false)).toBe("Ctrl+Shift+8");
  });

  it("shows Cmd and Option on Mac", () => {
    expect(shortcutLabel("Mod-Alt-1", true)).toBe("Cmd+Option+1");
    expect(shortcutLabel("Mod-Shift-s", true)).toBe("Cmd+Shift+S");
  });
});

describe("tooltip", () => {
  it("puts the shortcut in brackets after the name", () => {
    expect(tooltip("Bold", SHORTCUTS.bold, false)).toBe("Bold (Ctrl+B)");
    expect(tooltip("Heading 1", SHORTCUTS.heading1, true)).toBe("Heading 1 (Cmd+Option+1)");
  });
});

describe("isApplePlatform", () => {
  it("recognises Apple platforms", () => {
    expect(isApplePlatform("MacIntel")).toBe(true);
    expect(isApplePlatform("iPhone")).toBe(true);
  });

  it("does not treat Windows or Linux as Apple", () => {
    expect(isApplePlatform("Win32")).toBe(false);
    expect(isApplePlatform("Linux x86_64")).toBe(false);
  });
});

describe("SHORTCUTS", () => {
  it("gives every toolbar feature a shortcut", () => {
    for (const keys of Object.values(SHORTCUTS)) {
      expect(keys).toMatch(/^Mod(-(Alt|Shift))*-[a-z0-9]$/);
    }
    // No two features share a shortcut.
    expect(new Set(Object.values(SHORTCUTS)).size).toBe(Object.keys(SHORTCUTS).length);
  });
});
