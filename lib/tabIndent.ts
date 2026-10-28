import { Extension } from "@tiptap/react";

/**
 * Makes the Tab key indent instead of moving focus out of the editor.
 *
 * - In a list or checklist, Tab nests the item and Shift+Tab lifts it back out.
 * - Anywhere else, Tab inserts a tab at the cursor. With text selected, it indents every line the
 *   selection touches. Shift+Tab removes a tab from the start of those lines.
 * - Escape leaves the editor, so keyboard users can still Tab on to the rest of the page.
 */
export const TabIndent = Extension.create({
  name: "tabIndent",
  // Run before the list extensions, so Tab is always handled here and focus is never lost.
  priority: 1000,

  addKeyboardShortcuts() {
    const listType = () =>
      this.editor.isActive("taskItem")
        ? "taskItem"
        : this.editor.isActive("listItem")
          ? "listItem"
          : null;

    return {
      Tab: () => {
        const list = listType();
        if (list) {
          // Returns false for the first item (nothing above to nest under); the key is still consumed.
          this.editor.commands.sinkListItem(list);
          return true;
        }

        return this.editor.commands.command(({ tr, state }) => {
          const { from, to, empty } = state.selection;
          if (empty) {
            tr.insertText("\t");
            return true;
          }

          const starts: number[] = [];
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isTextblock) {
              starts.push(pos + 1);
              return false;
            }
            return true;
          });
          // Work from the end so earlier positions stay valid.
          for (const pos of starts.reverse()) tr.insertText("\t", pos);
          return true;
        });
      },

      "Shift-Tab": () => {
        const list = listType();
        if (list) {
          this.editor.commands.liftListItem(list);
          return true;
        }

        return this.editor.commands.command(({ tr, state }) => {
          const { from, to, empty } = state.selection;
          const { doc } = state;

          const starts: number[] = [];
          doc.nodesBetween(from, to, (node, pos) => {
            if (node.isTextblock) {
              starts.push(pos + 1);
              return false;
            }
            return true;
          });

          let removed = false;
          for (const pos of starts.reverse()) {
            if (doc.textBetween(pos, Math.min(pos + 1, doc.content.size)) === "\t") {
              tr.delete(pos, pos + 1);
              removed = true;
            }
          }

          // No tab at the start of the line: take out one just before the cursor instead.
          if (!removed && empty && from > 0 && doc.textBetween(from - 1, from) === "\t") {
            tr.delete(from - 1, from);
          }
          return true;
        });
      },

      Escape: () => {
        this.editor.commands.blur();
        return true;
      },
    };
  },
});
