"use client";

import { useEffect, useRef } from "react";
import {
  EditorContent,
  useEditor,
  type Editor as TipTapEditor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./Toolbar";
import { TabIndent } from "@/lib/tabIndent";
import { titleFromContent } from "@/lib/title";

type Props = {
  /** Initial document. The editor is meant to be remounted (via `key`) when switching notes. */
  initialContent: JSONContent | null;
  onChange: (content: JSONContent, title: string, text: string) => void;
  /** Shown at the right of the status bar, such as "Saved to your account". */
  status?: string;
  statusTone?: "normal" | "error";
};

function Stats({ editor, status, statusTone }: { editor: TipTapEditor; status?: string; statusTone?: "normal" | "error" }) {
  const text = editor.getText({ blockSeparator: "\n" });
  const words = text.match(/\S+/g)?.length ?? 0;
  const characters = text.replace(/\n/g, "").length;

  return (
    // The status-bar class starts the text just after the red margin line, so the counts sit where the writing starts.
    <div className="status-bar flex flex-none items-center gap-4 border-t border-stone-200 bg-stone-100 py-2 pr-4 text-xs text-stone-500 dark:border-warmblack-line dark:bg-warmblack">
      <span>
        {words.toLocaleString()} {words === 1 ? "word" : "words"}
      </span>
      <span>
        {characters.toLocaleString()} {characters === 1 ? "character" : "characters"}
      </span>
      {status && (
        <span role="status" className={["ml-auto truncate", statusTone === "error" ? "text-red-700 dark:text-red-300" : ""].join(" ")}>
          {status}
        </span>
      )}
    </div>
  );
}

export default function Editor({ initialContent, onChange, status, statusTone }: Props) {
  // Always call the latest onChange without recreating the editor.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Start typing… try “- ” for a list or “[ ] ” for a checklist",
      }),
      TabIndent,
    ],
    content: initialContent ?? undefined,
    autofocus: "end",
    // Avoids a hydration mismatch with Next.js server rendering.
    immediatelyRender: false,
    // Re-render the toolbar and word count on every transaction so they stay in sync.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        "aria-label": "Note editor",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChangeRef.current(json, titleFromContent(json), editor.getText({ blockSeparator: "\n" }));
    },
  });

  if (!editor) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Toolbar editor={editor} />
      <div
        className="pad-sheet"
        // Clicking the empty paper below the text puts the cursor at the end.
        onClick={(e) => {
          if (e.target === e.currentTarget) editor.commands.focus("end");
        }}
      >
        <EditorContent editor={editor} />
      </div>
      <Stats editor={editor} status={status} statusTone={statusTone} />
    </div>
  );
}
