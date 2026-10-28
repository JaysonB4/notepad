"use client";

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import AccountButton from "./AccountButton";
import ThemeToggle from "./ThemeToggle";
import { BulletListIcon, ChecklistIcon, NumberedListIcon } from "./icons";

type ButtonProps = {
  /** Text or an icon. */
  label: ReactNode;
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
        "h-8 min-w-8 rounded-md px-2 text-sm transition-colors",
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

export default function Toolbar({ editor }: { editor: Editor }) {
  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-stone-300 bg-stone-100 px-3 py-2 md:pl-9 dark:border-warmblack-line dark:bg-warmblack"
    >
      <ToolbarButton
        label="B"
        title="Bold (Ctrl/Cmd+B)"
        className="font-bold"
        active={editor.isActive("bold")}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolbarButton
        label="I"
        title="Italic (Ctrl/Cmd+I)"
        className="italic"
        active={editor.isActive("italic")}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolbarButton
        label="S"
        title="Strikethrough"
        className="line-through"
        active={editor.isActive("strike")}
        onClick={() => chain().toggleStrike().run()}
      />

      <Divider />

      <ToolbarButton
        label="H1"
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => chain().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label="H2"
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      />

      <Divider />

      <ToolbarButton
        label={<BulletListIcon />}
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolbarButton
        label={<NumberedListIcon />}
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolbarButton
        label={<ChecklistIcon />}
        title="Checklist"
        active={editor.isActive("taskList")}
        onClick={() => chain().toggleTaskList().run()}
      />

      <Divider />

      <ToolbarButton
        label="“ ”"
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="</>"
        title="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => chain().toggleCodeBlock().run()}
      />

      <Divider />

      <ToolbarButton
        label="↶"
        title="Undo (Ctrl/Cmd+Z)"
        disabled={!editor.can().undo()}
        onClick={() => chain().undo().run()}
      />
      <ToolbarButton
        label="↷"
        title="Redo (Ctrl/Cmd+Shift+Z)"
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
