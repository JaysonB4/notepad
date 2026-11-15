"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Editor } from "@tiptap/react";
import { MAX_COLS, MAX_ROWS, clampSize } from "@/lib/tableSize";

type Props = {
  editor: Editor;
  onClose: () => void;
};

/** Small panel under the Table button, asking for the size of a new table. */
export default function TableInsertPopover({ editor, onClose }: Props) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const formRef = useRef<HTMLFormElement>(null);

  // Close on a click outside the panel, or on Escape.
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!formRef.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function insert(e: FormEvent) {
    e.preventDefault();
    editor
      .chain()
      .focus()
      .insertTable({
        rows: clampSize(rows, MAX_ROWS),
        cols: clampSize(cols, MAX_COLS),
        withHeaderRow: true,
      })
      .run();
    onClose();
  }

  return (
    <form
      ref={formRef}
      onSubmit={insert}
      aria-label="Insert table"
      className="absolute left-0 top-full z-30 mt-1.5 flex w-52 flex-col gap-3 rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm shadow-lg dark:border-warmblack-edge dark:bg-warmblack"
    >
      <label className="flex items-center justify-between gap-3">
        <span>Rows</span>
        <input
          type="number"
          min={1}
          max={MAX_ROWS}
          value={rows}
          autoFocus
          onChange={(e) => setRows(Number(e.target.value))}
          className="w-20 rounded border border-stone-300 bg-white px-2 py-1 dark:border-warmblack-edge dark:bg-warmblack-deep"
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Columns</span>
        <input
          type="number"
          min={1}
          max={MAX_COLS}
          value={cols}
          onChange={(e) => setCols(Number(e.target.value))}
          className="w-20 rounded border border-stone-300 bg-white px-2 py-1 dark:border-warmblack-edge dark:bg-warmblack-deep"
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 hover:bg-stone-200 dark:hover:bg-warmblack-hover">
          Cancel
        </button>
        <button type="submit" className="emboss px-3 py-1.5">
          Insert
        </button>
      </div>
    </form>
  );
}
