import CodeBlock from "@tiptap/extension-code-block";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/** Narrowest a code block can be dragged, in pixels. */
const MIN_WIDTH = 160;

function applyWidth(pre: HTMLElement, width: number | null) {
  if (width) pre.style.width = `${width}px`;
  else pre.style.removeProperty("width");
}

/**
 * A code block whose right edge can be dragged to change its width.
 * The width is stored in the note, so it is kept when the note is saved and reloaded.
 */
export const ResizableCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const w = Number(el.getAttribute("data-width"));
          return w > 0 ? w : null;
        },
        renderHTML: (attrs: { width?: number | null }) =>
          attrs.width ? { "data-width": String(attrs.width), style: `width: ${attrs.width}px` } : {},
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      let current: ProseMirrorNode = node;

      const frame = document.createElement("div");
      frame.className = "code-block-frame";
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      pre.appendChild(code);
      const handle = document.createElement("div");
      handle.className = "code-resize-handle";
      handle.contentEditable = "false";
      frame.append(pre, handle);
      applyWidth(pre, current.attrs.width);

      handle.addEventListener("pointerdown", (event: PointerEvent) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = pre.getBoundingClientRect().width;
        // The most it can be is the width of the sheet it sits in.
        const maxWidth = frame.parentElement?.clientWidth ?? startWidth;
        let width = startWidth;
        frame.classList.add("is-resizing");

        const onMove = (e: PointerEvent) => {
          width = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth + e.clientX - startX));
          applyWidth(pre, width);
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          frame.classList.remove("is-resizing");
          const pos = getPos();
          if (typeof pos !== "number") return;
          // Store the width in the note. Text inside the block is unchanged.
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, width: Math.round(width) }),
          );
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      });

      return {
        dom: frame,
        contentDOM: code,
        update(updated: ProseMirrorNode) {
          if (updated.type !== current.type) return false;
          current = updated;
          applyWidth(pre, updated.attrs.width);
          return true;
        },
        // Changes to the frame or its pre (such as the width while dragging) are not text edits.
        ignoreMutation(mutation: MutationRecord | { type: "selection"; target: Node }) {
          return !code.contains(mutation.target);
        },
        stopEvent(event: Event) {
          return handle.contains(event.target as Node);
        },
      };
    };
  },
});
