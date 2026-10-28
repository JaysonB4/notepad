"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { JSONContent } from "@tiptap/react";
import type { User } from "@supabase/supabase-js";
import Editor from "./Editor";
import SidebarToggle from "./SidebarToggle";
import { deleteCloudNote, fetchNotes, upsertNote } from "@/lib/cloudNotes";
import { getSupabase } from "@/lib/supabase";
import { visibleSorted } from "@/lib/notesView";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  createNote,
  loadSidebarCollapsed,
  loadState,
  saveSidebarCollapsed,
  saveState,
  type Note,
} from "@/lib/storage";

/** Where a note lives: this browser, or the signed-in account. */
type Source = "local" | "cloud";
type Active = { source: Source; id: string };
type Status = { kind: "idle" | "saving" | "saved" | "error"; text: string };

/** Drag-and-drop payload type, so only note drags from this sidebar are accepted. */
const DRAG_TYPE = "application/x-notepad-note";
/** How long to wait after the last edit before saving to the account. */
const SAVE_DELAY_MS = 500;
const RETRY_DELAY_MS = 5000;

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function Notepad() {
  const { user, ready: authReady } = useAuthUser();
  // Notes on this device (localStorage) and notes in the account (Supabase).
  const [notes, setNotes] = useState<Note[]>([]);
  const [cloudNotes, setCloudNotes] = useState<Note[]>([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  // Mobile: the sidebar slides over the page.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop: the sidebar can be collapsed with the arrow button.
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [dropActive, setDropActive] = useState(false);

  // Latest values for callbacks and event listeners that outlive a render.
  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const latest = useRef({ notes, active });
  latest.current = { notes, active };

  // Account notes waiting to be saved, keyed by id. Only the newest copy of each note is kept.
  const pending = useRef(new Map<string, Note>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load this device's notes after mount (localStorage doesn't exist during server rendering).
  useEffect(() => {
    const state = loadState();
    setNotes(state.notes);
    setActive(state.activeId ? { source: "local", id: state.activeId } : null);
    setCollapsed(loadSidebarCollapsed());
    setReady(true);
  }, []);

  // Remember whether the sidebar is collapsed.
  useEffect(() => {
    if (!ready) return;
    saveSidebarCollapsed(collapsed);
  }, [collapsed, ready]);

  // Save an account note, retrying after a failure. Nothing is lost if the request fails.
  const flushCloud = useCallback(async () => {
    const supabase = getSupabase();
    const u = userRef.current;
    if (!supabase || !u || pending.current.size === 0) return;

    setStatus({ kind: "saving", text: "Saving to your account…" });
    let failed = false;
    for (const note of [...pending.current.values()]) {
      try {
        await upsertNote(supabase, u.id, note);
        // Only clear it if nothing newer was queued while the request was running.
        if (pending.current.get(note.id) === note) pending.current.delete(note.id);
      } catch {
        failed = true;
      }
    }

    if (failed) {
      setStatus({ kind: "error", text: "Couldn't save to your account. Retrying…" });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        void flushCloud();
      }, RETRY_DELAY_MS);
    } else if (pending.current.size === 0) {
      setStatus({ kind: "saved", text: "Saved to your account" });
    }
  }, []);

  const queueCloudSave = useCallback(
    (note: Note) => {
      pending.current.set(note.id, note);
      setStatus({ kind: "saving", text: "Saving to your account…" });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        void flushCloud();
      }, SAVE_DELAY_MS);
    },
    [flushCloud],
  );

  // Debounced autosave of this device's notes. Account notes are saved separately above.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(
      () => saveState({ notes, activeId: active?.source === "local" ? active.id : null }),
      250,
    );
    return () => clearTimeout(t);
  }, [notes, active, ready]);

  // Flush immediately if the tab is closed or hidden before a debounce fires.
  useEffect(() => {
    if (!ready) return;
    const flushAll = () => {
      const { notes: n, active: a } = latest.current;
      saveState({ notes: n, activeId: a?.source === "local" ? a.id : null });
      void flushCloud();
    };
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", flushAll);
    return () => {
      window.removeEventListener("pagehide", flushAll);
      document.removeEventListener("visibilitychange", flushAll);
    };
  }, [ready, flushCloud]);

  // Stop a pending save timer when the page goes away.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  // Load the account's notes on sign in, and forget them on sign out.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!authReady) return;
    const supabase = getSupabase();
    if (!userId || !supabase) {
      setCloudNotes([]);
      setCloudLoaded(false);
      pending.current.clear();
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      setStatus({ kind: "idle", text: "" });
      return;
    }

    let cancelled = false;
    setCloudLoaded(false);
    fetchNotes(supabase)
      .then((list) => {
        if (cancelled) return;
        // Keep any note created while the list was still loading.
        setCloudNotes((prev) => {
          const fetched = new Set(list.map((n) => n.id));
          return [...list, ...prev.filter((n) => !fetched.has(n.id))];
        });
        setCloudLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus({ kind: "error", text: `Couldn't load your account notes. ${errorText(err)}` });
        setCloudLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, userId]);

  // The note on screen. If the active one is gone (e.g. after signing out), show the first local note.
  const current = useMemo<{ source: Source; note: Note } | null>(() => {
    if (active) {
      const found = (active.source === "cloud" ? cloudNotes : notes).find((n) => n.id === active.id);
      if (found) return { source: active.source, note: found };
    }
    const fallback = notes[0];
    return fallback ? { source: "local", note: fallback } : null;
  }, [active, notes, cloudNotes]);

  const handleChange = useCallback(
    (source: Source, id: string, content: JSONContent, title: string, text: string) => {
      const next: Note = { id, title, text, content, updatedAt: Date.now() };
      if (source === "local") {
        setNotes((prev) => prev.map((n) => (n.id === id ? next : n)));
      } else {
        setCloudNotes((prev) => prev.map((n) => (n.id === id ? next : n)));
        queueCloudSave(next);
      }
    },
    [queueCloudSave],
  );

  const addNote = () => {
    setQuery("");
    setSidebarOpen(false);
    const note = createNote();
    if (userRef.current) {
      // Signed in: new notes go straight to the account.
      setCloudNotes((prev) => [note, ...prev]);
      setActive({ source: "cloud", id: note.id });
      queueCloudSave(note);
    } else {
      setNotes((prev) => [note, ...prev]);
      setActive({ source: "local", id: note.id });
    }
  };

  const deleteNote = async (source: Source, id: string) => {
    const list = source === "cloud" ? cloudNotes : notes;
    const note = list.find((n) => n.id === id);
    if (!note) return;
    const label = note.title ? `“${note.title}”` : "this note";
    if (!window.confirm(`Delete ${label}? This can't be undone.`)) return;

    if (source === "local") {
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length === 0) {
        const fresh = createNote();
        setNotes([fresh]);
        setActive({ source: "local", id: fresh.id });
        return;
      }
      setNotes(remaining);
      if (active?.id === id) {
        const next = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setActive({ source: "local", id: next.id });
      }
      return;
    }

    pending.current.delete(id);
    setCloudNotes((prev) => prev.filter((n) => n.id !== id));
    if (active?.id === id) setActive(null);
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await deleteCloudNote(supabase, id);
    } catch (err) {
      // Put it back, since it is still in the account.
      setCloudNotes((prev) => [note, ...prev]);
      setStatus({ kind: "error", text: `Couldn't delete “${note.title || "untitled note"}”. ${errorText(err)}` });
    }
  };

  /** Copies a note from this device into the account, then removes the local copy. */
  const moveToAccount = async (localId: string) => {
    const supabase = getSupabase();
    const u = userRef.current;
    const note = notes.find((n) => n.id === localId);
    if (!supabase || !u || !note) return;

    const label = note.title || "untitled note";
    setStatus({ kind: "saving", text: `Moving “${label}” to your account…` });
    // The account copy gets a fresh id, so it can't clash with an id from another device.
    const copy: Note = { ...createNote(), title: note.title, text: note.text, content: note.content, updatedAt: note.updatedAt };
    try {
      await upsertNote(supabase, u.id, copy);
    } catch (err) {
      // Nothing was removed, so the note is still on this device.
      setStatus({ kind: "error", text: `Couldn't move “${label}”. It's still on this device. ${errorText(err)}` });
      return;
    }

    setCloudNotes((prev) => [copy, ...prev]);
    const remaining = notes.filter((n) => n.id !== localId);
    setNotes(remaining.length > 0 ? remaining : [createNote()]);
    setActive((a) => (a?.id === localId ? { source: "cloud", id: copy.id } : a));
    setStatus({ kind: "saved", text: `Moved “${label}” to your account.` });
  };

  const onNoteDragStart = (e: DragEvent<HTMLLIElement>, id: string) => {
    e.dataTransfer.setData(DRAG_TYPE, id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onAccountDragOver = (e: DragEvent<HTMLElement>) => {
    if (!userRef.current || !Array.from(e.dataTransfer.types).includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropActive(true);
  };

  const onAccountDragLeave = (e: DragEvent<HTMLElement>) => {
    // Only clear the highlight when the pointer leaves the section, not when it moves over a child.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropActive(false);
  };

  const onAccountDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDropActive(false);
    const id = e.dataTransfer.getData(DRAG_TYPE);
    if (id) void moveToAccount(id);
  };

  // What the status bar says about the note on screen.
  let statusLine = "";
  let statusTone: "normal" | "error" = "normal";
  if (current?.source === "cloud") {
    statusLine = status.kind === "idle" ? "Saved to your account" : status.text;
    statusTone = status.kind === "error" ? "error" : "normal";
  } else if (status.kind === "error") {
    statusLine = status.text;
    statusTone = "error";
  } else if (user) {
    statusLine = "On this device";
  }

  const localList = visibleSorted(notes, query);
  const cloudList = visibleSorted(cloudNotes, query);

  const renderItem = (note: Note, source: Source) => {
    const isActive = current?.source === source && current.note.id === note.id;
    const draggable = source === "local" && !!user;
    const label = note.title || "untitled note";
    return (
      <li
        key={`${source}:${note.id}`}
        className="group relative"
        draggable={draggable}
        onDragStart={draggable ? (e) => onNoteDragStart(e, note.id) : undefined}
      >
        <button
          type="button"
          onClick={() => {
            setActive({ source, id: note.id });
            setSidebarOpen(false);
          }}
          className={[
            "w-full rounded-md px-3 py-2 text-left",
            isActive ? "bg-stone-200 dark:bg-warmblack-hover" : "hover:bg-stone-200/60 dark:hover:bg-warmblack-hover/60",
          ].join(" ")}
        >
          <span className="block truncate pr-12 text-sm font-medium">{note.title || "Untitled"}</span>
          <span className="block text-xs text-stone-500">{formatDate(note.updatedAt)}</span>
        </button>
        {draggable && (
          <button
            type="button"
            onClick={() => void moveToAccount(note.id)}
            aria-label={`Move ${label} to my account`}
            title="Move to my account"
            className="absolute right-8 top-2 rounded px-1.5 text-stone-400 opacity-0 hover:bg-stone-300 hover:text-amber-700 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-warmblack-edge"
          >
            ↑
          </button>
        )}
        <button
          type="button"
          onClick={() => void deleteNote(source, note.id)}
          aria-label={`Delete ${label}`}
          title="Delete note"
          className="absolute right-2 top-2 rounded px-1.5 text-stone-400 opacity-0 hover:bg-stone-300 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-warmblack-edge"
        >
          ✕
        </button>
      </li>
    );
  };

  const sectionHeading = "px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-500";

  if (!ready) {
    return <div className="h-screen" aria-busy="true" />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={[
          "fixed inset-y-0 left-0 z-20 flex w-72 border-r border-stone-200 bg-stone-100 transition-transform",
          "dark:border-warmblack-line dark:bg-warmblack",
          "md:static md:translate-x-0 md:overflow-hidden md:transition-[width,visibility] md:duration-200",
          // Collapsed: width animates to 0, then the contents are hidden from keyboard and screen readers.
          collapsed ? "md:invisible md:w-0 md:border-r-0" : "md:w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Fixed-width inner column so the contents clip instead of squashing while the sidebar animates. */}
        <div className="flex w-[calc(18rem-1px)] flex-none flex-col">
          <div className="flex items-center gap-2 p-3">
            <h1 className="flex-1 px-1 text-lg font-semibold">Notepad</h1>
            <button
              type="button"
              onClick={addNote}
              className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-stone-900 hover:bg-amber-300"
            >
              + New
            </button>
          </div>

          <div className="px-3 pb-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-500 dark:border-warmblack-edge dark:bg-warmblack-deep"
            />
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="Notes">
            {user ? (
              <>
                <div className="pt-1">
                  <h2 className={sectionHeading}>On this device</h2>
                  {localList.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-stone-500">
                      {query ? `No notes match “${query}”.` : "No notes on this device."}
                    </p>
                  ) : (
                    <ul className="space-y-0.5">{localList.map((n) => renderItem(n, "local"))}</ul>
                  )}
                </div>

                <section
                  aria-label="My account notes"
                  onDragOver={onAccountDragOver}
                  onDragLeave={onAccountDragLeave}
                  onDrop={onAccountDrop}
                  className={[
                    "mt-3 rounded-md p-1 transition-colors",
                    dropActive ? "bg-amber-100 ring-2 ring-amber-400 dark:bg-amber-900/30" : "",
                  ].join(" ")}
                >
                  <h2 className={sectionHeading}>My account</h2>
                  {!cloudLoaded ? (
                    <p className="px-2 py-2 text-sm text-stone-500">Loading your notes…</p>
                  ) : cloudList.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-stone-500">
                      {query ? `No notes match “${query}”.` : "Drag notes here to save them to your account."}
                    </p>
                  ) : (
                    <ul className="space-y-0.5">{cloudList.map((n) => renderItem(n, "cloud"))}</ul>
                  )}
                </section>
              </>
            ) : localList.length === 0 ? (
              <p className="px-2 py-4 text-sm text-stone-500">
                {query ? `No notes match “${query}”.` : "No notes yet."}
              </p>
            ) : (
              <ul className="space-y-0.5">{localList.map((n) => renderItem(n, "local"))}</ul>
            )}
          </nav>

          <p className="border-t border-stone-200 px-4 py-2 text-center text-xs text-stone-500 dark:border-warmblack-line">
            {user ? "Account notes sync across your devices." : "Saved in this browser only."}
          </p>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main editor area */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Arrow tab on the sidebar's outer edge, overlapping the toolbar (desktop). */}
        <SidebarToggle collapsed={collapsed} onClick={() => setCollapsed((c) => !c)} />

        {/* Phones: the "Notes" button opens the sidebar as a slide-over. */}
        <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-100 px-3 py-2 md:hidden dark:bg-warmblack dark:border-warmblack-line">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md px-2 py-1 text-sm hover:bg-stone-200 dark:hover:bg-warmblack-hover"
          >
            ☰ Notes
          </button>
          <span className="truncate text-sm text-stone-500">{current?.note.title || "Untitled"}</span>
        </div>

        {current && (
          <div className="flex min-h-0 flex-1 flex-col">
            <Editor
              key={`${current.source}:${current.note.id}`}
              initialContent={current.note.content}
              onChange={(content, title, text) => handleChange(current.source, current.note.id, content, title, text)}
              status={statusLine}
              statusTone={statusTone}
            />
          </div>
        )}
      </main>
    </div>
  );
}
