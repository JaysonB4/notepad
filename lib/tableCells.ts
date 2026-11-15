import { TableCell, TableHeader } from "@tiptap/extension-table";

/** Width of a new column, in pixels. A table has this width per column until someone drags a border. */
export const DEFAULT_COLUMN_WIDTH = 140;

/**
 * Every cell gets a width by default, so a new table has fixed column widths instead of sizing
 * itself to its contents. Dragging a column border changes that column's width.
 */
const colwidth = {
  default: [DEFAULT_COLUMN_WIDTH],
  parseHTML: (el: HTMLElement) => {
    const widths = (el.getAttribute("colwidth") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => n > 0);
    return widths.length ? widths : null;
  },
  renderHTML: (attrs: { colwidth?: number[] | null }) =>
    attrs.colwidth?.length ? { colwidth: attrs.colwidth.join(",") } : {},
};

export const FixedWidthCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), colwidth };
  },
});

export const FixedWidthHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), colwidth };
  },
});
