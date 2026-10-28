# Notepad

A simple notepad built with **Next.js**, **TipTap**, and **Tailwind CSS**. Notes are kept in your browser's `localStorage`. Optionally, you can create an account (powered by **Supabase**) to keep notes that sync across devices.

## Features

- Yellow legal-pad look: ruled lines, a solid red margin line, and every line of text sits on a ruled line
- Rich text: bold, italic, strikethrough, headings, quotes, code blocks
- Bullet lists, numbered lists, and **checklists with checkboxes**
- **Tab key indentation**: Tab nests a list item and Shift+Tab lifts it back out. In plain text, Tab inserts an indent at the cursor (or indents every selected line) and Shift+Tab removes one. Press Escape to leave the editor, then Tab moves on to the rest of the page.
- Word and character count in the bottom bar, just after the red margin
- Sidebar titles come from the first line of each note (the first item, for a list)
- Markdown shortcuts: `- ` for a bullet, `1. ` for a numbered list, `[ ] ` for a checkbox, `# ` for a heading
- Multiple notes with search
- Collapsible sidebar: click the arrow tab on its outer edge, level with the toolbar, to hide or show it (remembered between visits)
- Autosave on every change
- Light and dark mode, with a toggle at the right end of the toolbar. Your choice is remembered; on a first visit it follows your system setting. Dark mode uses a warm black toolbar and sidebar with a warm grey pad.

### Accounts and sync

- A **Sign up** button sits beside the theme toggle. Once you are logged in, it shows your username instead, and its menu has **Log out**.
- When logged out, notes stay in `localStorage` on this device.
- When logged in, the sidebar has two groups:
  - **On this device**: notes still stored in this browser.
  - **My account**: notes stored in your Supabase account. They appear on any device where you log in.
- New notes and edits are saved to your account automatically while you are logged in. Edits are saved about half a second after you stop typing, and the status line at the bottom of the page shows the save state.
- To move a local note into your account, drag it from **On this device** onto **My account**. On touch screens, use the ↑ button on the note instead. The copy in your account gets a new ID, so notes never clash between devices. The local copy is removed only after the account copy is saved.
- Deleting a note in **My account** removes it from the database.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The notepad works without any setup, but the account features need a Supabase project (see below).

For a production build:

```bash
npm run build
npm start
```

## Setting up Supabase (for accounts and sync)

1. **Create a project** at https://supabase.com. Note the project URL and the `anon` public key under **Project Settings → API**.
2. **Create the table.** Open **SQL Editor** in the Supabase dashboard, paste the contents of `supabase/schema.sql`, and run it. This creates the `notes` table and the row-level security policies, so each user can only read and change their own notes.
3. **Add your keys.** Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   Restart `npm run dev` after changing these. `.env.local` is git-ignored.
4. **Configure Auth.** In **Authentication → URL Configuration**, set the Site URL (for example `http://localhost:3000` while developing) and add your deployed URL to the redirect URLs.
5. **Email confirmation.** By default Supabase asks new users to confirm their email before they can log in. You can keep that, or turn it off under **Authentication → Providers → Email** while testing.

Without these variables, the notepad still works on this device, but the sign-up dialog shows a "not configured" message instead of a form.

## Testing and security

```bash
npm test          # unit tests (Vitest, jsdom)
npm run audit     # npm audit at moderate severity or higher
```

The tests live in `tests/`:

- `dependencies.test.ts` checks the installed packages in `package-lock.json` against the vulnerable version ranges in `tests/fixtures/advisories.json`. It fails if a vulnerable version is installed, including nested copies.
- `title.test.ts`, `storage.test.ts` and `tabIndent.test.ts` cover note titles, saved-state loading and Tab indentation.
- `account.test.ts` covers the account helpers.
- `cloudNotes.test.ts` covers mapping cloud rows to notes, and the fetch, save and delete calls to the `notes` table.
- `notesView.test.ts` covers sorting and search for the sidebar.

Run `npm audit` after changing dependencies. The fixture covers the advisories found in the earlier dependency set. New advisories are only caught by `npm audit`.

The account and sync screens are checked with unit tests on their helpers. Test the live Supabase flow yourself after setup: sign up, create a note, log out and back in, and check that it appears on another browser.

## Project structure

```
app/
  layout.tsx        Root layout
  page.tsx          Renders the Notepad
  globals.css       Tailwind + editor and checkbox styles
components/
  Notepad.tsx       Sidebar groups, note list, search, autosave, drag-and-drop
  Editor.tsx        TipTap editor setup, word count and status line
  Toolbar.tsx       Formatting buttons
  AccountButton.tsx Sign up button, or username menu when logged in
  AccountDialog.tsx Sign up and log in form
  icons.tsx         Bullet, numbered and checklist icons
  ThemeToggle.tsx   Light/dark switch (shows the current mode)
  SidebarToggle.tsx Arrow tab that hides and shows the sidebar
lib/
  storage.ts        localStorage load/save and the Note type
  tabIndent.ts      TipTap extension for Tab / Shift+Tab indentation
  title.ts          Works out a note's title from its first line
  supabase.ts       Supabase client (reads the .env.local values)
  account.ts        Sign up, log in, log out and display name helpers
  useAuthUser.ts    Hook that tracks the logged-in user
  cloudNotes.ts     Reads and writes the account's notes table
  notesView.ts      Sorting and search for the note list
supabase/
  schema.sql        Creates the notes table and its security policies
tests/              Vitest unit tests (see above)
```

## Notes

- Local notes live only in the browser you use. Clearing site data deletes them. Account notes are stored in Supabase and survive that.
- Local notes are stored as TipTap JSON under the `notepad:v1` key.
- Account notes that have not reached the server yet are kept in memory and retried every few seconds. Logging out before a save finishes may lose the most recent edit.
- If you open the app in two tabs at once, the last tab to save wins.
