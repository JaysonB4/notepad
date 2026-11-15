"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import AccountButton from "./AccountButton";
import TableInsertPopover from "./TableInsertPopover";
import ThemeToggle from "./ThemeToggle";
import { BulletListIcon, ChecklistIcon, NumberedListIcon, RedoIcon, TableIcon, UndoIcon } from "./icons";
import { SHORTCUTS, isApplePlatform, tooltip } from "@/lib/shortcuts";

type ButtonProps = {
  /** Text or an icon. */
  label: ReactNode;
  /** Shown as the tooltip, and read by screen readers. */
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

function ToolbarButton({ label, title, onClick, active, disabled, className = "" }: ButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep focus in the editor when clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        // Centre text and icons in the button, so they line up vertically.
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors",
        "hover:bg-stone-200 dark:hover:bg-warmblack-hover",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent",
        active ? "bg-stone-200 font-semibold dark:bg-warmblack-hover" : "",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-stone-300 dark:bg-warmblack-edge" aria-hidden />;
}

type Props = {
  editor: Editor;
  tableOpen: boolean;
  onTableOpen: () => void;
  onTableClose: () => void;
};

export default function Toolbar({ editor, tableOpen, onTableOpen, onTableClose }: Props) {
  const chain = () => editor.chain().focus();

  // Shortcut names differ by platform (Cmd on Mac, Ctrl elsewhere). Read it after mount so the server and client render match.
  const [apple, setApple] = useState(false);
  useEffect(() => {
    setApple(isApplePlatform(navigator.platform));
  }, []);

  const tip = (name: string, keys: string) => tooltip(name, keys, apple);

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-stone-300 bg-stone-100 px-3 py-2 md:pl-9 dark:border-warmblack-line dark:bg-warmblack"
    >
      <ToolbarButton
        label="B"
        title={tip("Bold", SHORTCUTS.bold)}
        className="font-bold"
        active={editor.isActive("bold")}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolbarButton
        label="I"
        title={tip("Italic", SHORTCUTS.italic)}
        className="italic"
        active={editor.isActive("italic")}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolbarButton
        label="S"
        title={tip("Strikethrough", SHORTCUTS.strike)}
        className="line-through"
        active={editor.isActive("strike")}
        onClick={() => chain().toggleStrike().run()}
      />

      <Divider />

      <ToolbarButton
        label="H1"
        title={tip("Heading 1", SHORTCUTS.heading1)}
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => chain().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label="H2"
        title={tip("Heading 2", SHORTCUTS.heading2)}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      />

      <Divider />

      <ToolbarButton
        label={<BulletListIcon />}
        title={tip("Bullet list", SHORTCUTS.bulletList)}
        active={editor.isActive("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolbarButton
        label={<NumberedListIcon />}
        title={tip("Numbered list", SHORTCUTS.orderedList)}
        active={editor.isActive("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolbarButton
        label={<ChecklistIcon />}
        title={tip("Checklist", SHORTCUTS.checklist)}
        active={editor.isActive("taskList")}
        onClick={() => chain().toggleTaskList().run()}
      />

      <Divider />

      <ToolbarButton
        label="“ ”"
        title={tip("Quote", SHORTCUTS.quote)}
        active={editor.isActive("blockquote")}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="</>"
        title={tip("Code block", SHORTCUTS.codeBlock)}
        active={editor.isActive("codeBlock")}
        onClick={() => chain().toggleCodeBlock().run()}
      />

      <Divider />

      <div className="relative">
        <ToolbarButton
          label={<TableIcon />}
          title={tip("Insert table", SHORTCUTS.table)}
          active={tableOpen}
          onClick={onTableOpen}
        />
        {tableOpen && <TableInsertPopover editor={editor} onClose={onTableClose} />}
      </div>

      <Divider />

      <ToolbarButton
        label={<UndoIcon />}
        title={tip("Undo", SHORTCUTS.undo)}
        disabled={!editor.can().undo()}
        onClick={() => chain().undo().run()}
      />
      <ToolbarButton
        label={<RedoIcon />}
        title={tip("Redo", SHORTCUTS.redo)}
        disabled={!editor.can().redo()}
        onClick={() => chain().redo().run()}
      />

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <AccountButton />
      </div>
    </div>
  );
}
