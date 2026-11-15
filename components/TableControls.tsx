"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { Selection } from "@tiptap/pm/state";

type Box = {
  /** Document position of the table, used as its key. */
  key: number;
  /** Position and size of the table, inside the scrolling sheet, in pixels. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Bottom edge of the table. The row button fills the ruled line directly below it. */
  bottom: number;
  /** Height of one ruled line. */
  line: number;
  /** Document position of the last cell. Adding a row or column after it adds one at the end of the table. */
  lastCell: number;
};

const CELL_TYPES = new Set(["tableCell", "tableHeader"]);

/** How far from a table the buttons start to appear, in pixels. */
const REACH = 40;
/** Width of the column button's clickable strip, to the right of the table. */
const COLUMN_STRIP = 24;
/** Thickness of the visible bar inside each button. */
const BAR = 16;

/** The bar inside a button. Its colours follow the sheet's theme. */
function PlusBar({ vertical }: { vertical: boolean }) {
  return (
    <span
      // Same colour as the table borders, so the bars and the table read as one.
      style={{ borderColor: "var(--table-line)", color: "var(--table-line)" }}
      className={[
        "flex items-center justify-center rounded-md border",
        "group-hover:bg-stone-300/50 dark:group-hover:bg-warmblack-hover/60",
        vertical ? "h-full w-4" : "h-4 w-full",
      ].join(" ")}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
        <path d="M5 0.75v8.5M0.75 5h8.5" />
      </svg>
    </span>
  );
}

/**
 * The add buttons for each table: a strip to the right (adds a column) and a strip below (adds a row).
 * The row strip fills the ruled line under the table, which the sheet keeps empty, so the cursor can't
 * be placed there and text can't be typed into it. The buttons fade in when the cursor is near.
 */
export default function TableControls({
  editor,
  containerRef,
}: {
  editor: Editor;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [nearKey, setNearKey] = useState<number | null>(null);
  const boxesRef = useRef<Box[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const base = container.getBoundingClientRect();
    const found: Box[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== "table") return true;

      const wrapper = editor.view.nodeDOM(pos) as HTMLElement | null;
      // The table element itself, not the wrapper, which can be wider than the table.
      const table = wrapper?.matches?.("table") ? wrapper : wrapper?.querySelector("table");
      if (!table) return false;

      // Find the last cell. Cells come in document order, so the last one seen is the bottom-right cell.
      let lastCell = -1;
      node.descendants((child, childPos) => {
        if (CELL_TYPES.has(child.type.name)) lastCell = pos + 1 + childPos;
        return true;
      });
      if (lastCell < 0) return false;

      const r = table.getBoundingClientRect();
      // Rows are exactly one ruled line tall, so the first row gives the line height.
      const line = table.querySelector("tr")?.getBoundingClientRect().height || 30;

      found.push({
        key: pos,
        left: r.left - base.left + container.scrollLeft,
        top: r.top - base.top + container.scrollTop,
        width: r.width,
        height: r.height,
        bottom: r.bottom - base.top + container.scrollTop,
        line,
        lastCell,
      });
      return false;
    });

    boxesRef.current = found;
    setBoxes(found);
  }, [containerRef, editor]);

  useEffect(() => {
    // Measure after the browser has laid out the new content.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const container = containerRef.current;

    schedule();
    editor.on("update", schedule);
    window.addEventListener("resize", schedule);
    container?.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      editor.off("update", schedule);
      window.removeEventListener("resize", schedule);
      container?.removeEventListener("scroll", schedule);
    };
  }, [containerRef, editor, measure]);

  // Show the buttons for the table the cursor is near, and hide them otherwise.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: PointerEvent) => {
      const base = container.getBoundingClientRect();
      const x = e.clientX - base.left + container.scrollLeft;
      const y = e.clientY - base.top + container.scrollTop;
      const near = boxesRef.current.find(
        (b) =>
          x >= b.left - REACH &&
          x <= b.left + b.width + COLUMN_STRIP + REACH &&
          y >= b.top - REACH &&
          y <= b.bottom + b.line + REACH,
      );
      setNearKey(near ? near.key : null);
    };
    const onLeave = () => setNearKey(null);

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [containerRef]);

  /** Put the cursor in the last cell, then run the table command, so it acts on that row and column. */
  function runFromLastCell(box: Box, command: "addColumnAfter" | "addRowAfter") {
    const chain = editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        // Move into the cell's text. Selection.near finds the nearest valid text position inside it.
        tr.setSelection(Selection.near(state.doc.resolve(box.lastCell + 1), 1));
        return true;
      });
    // The editor's update event measures the table again once the new row or column is drawn.
    (command === "addColumnAfter" ? chain.addColumnAfter() : chain.addRowAfter()).run();
  }

  /** Buttons are faded out unless the cursor is near their table, or they have keyboard focus. */
  function visibility(key: number) {
    return nearKey === key ? "opacity-100" : "opacity-0 focus-visible:opacity-100";
  }

  // "table-control" lets the stylesheet hide these while a column border is being dragged.
  const buttonBase = "table-control group absolute flex items-center justify-center text-base leading-none transition-opacity duration-200";

  return (
    <>
      {boxes.map((box) => (
        <div key={box.key}>
          <button
            type="button"
            aria-label="Add column"
            title="Add column"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runFromLastCell(box, "addColumnAfter")}
            className={[buttonBase, visibility(box.key)].join(" ")}
            style={{ left: box.left + box.width + 2, top: box.top, width: COLUMN_STRIP, height: box.height }}
          >
            <PlusBar vertical />
          </button>
          <button
            type="button"
            aria-label="Add row"
            title="Add row"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runFromLastCell(box, "addRowAfter")}
            className={[buttonBase, visibility(box.key)].join(" ")}
            style={{ left: box.left, top: box.bottom, width: box.width, height: box.line }}
          >
            <PlusBar vertical={false} />
          </button>
        </div>
      ))}
    </>
  );
}
