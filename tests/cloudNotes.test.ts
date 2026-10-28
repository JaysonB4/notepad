import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteCloudNote, fetchNotes, noteToRow, rowToNote, upsertNote, type NoteRow } from "@/lib/cloudNotes";
import type { Note } from "@/lib/storage";

const note: Note = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Groceries",
  text: "Groceries\nMilk",
  content: { type: "doc", content: [{ type: "paragraph" }] },
  updatedAt: Date.parse("2026-10-27T10:00:00.000Z"),
};

/**
 * A stand-in for the Supabase query builder. It records each call and returns the result it was given.
 * `select` ... `order` resolves to `selectResult`; `upsert` and `delete().eq()` resolve to their results.
 */
function fakeClient(results: { select?: unknown; upsert?: unknown; del?: unknown } = {}) {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder = {
    select(...args: unknown[]) {
      calls.push({ method: "select", args });
      return builder;
    },
    order(...args: unknown[]) {
      calls.push({ method: "order", args });
      return Promise.resolve(results.select ?? { data: [], error: null });
    },
    upsert(...args: unknown[]) {
      calls.push({ method: "upsert", args });
      return Promise.resolve(results.upsert ?? { error: null });
    },
    delete(...args: unknown[]) {
      calls.push({ method: "delete", args });
      return builder;
    },
    eq(...args: unknown[]) {
      calls.push({ method: "eq", args });
      return Promise.resolve(results.del ?? { error: null });
    },
  };
  const client = { from: (table: string) => (calls.push({ method: "from", args: [table] }), builder) };
  return { client: client as unknown as SupabaseClient, calls };
}

describe("row mapping", () => {
  it("turns a database row into a note", () => {
    const row: NoteRow = {
      id: note.id,
      title: "Groceries",
      plain_text: "Groceries\nMilk",
      content: note.content,
      updated_at: "2026-10-27T10:00:00.000Z",
    };
    expect(rowToNote(row)).toEqual(note);
  });

  it("falls back to the current time when the row has no valid date", () => {
    const before = Date.now();
    const n = rowToNote({ id: "x", title: "", plain_text: "", content: null, updated_at: "not a date" });
    expect(n.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("writes a note with the owner's id and an ISO timestamp", () => {
    expect(noteToRow(note, "user-1")).toEqual({
      id: note.id,
      user_id: "user-1",
      title: "Groceries",
      plain_text: "Groceries\nMilk",
      content: note.content,
      updated_at: "2026-10-27T10:00:00.000Z",
    });
  });

  it("round-trips a note through the row format", () => {
    expect(rowToNote(noteToRow(note, "user-1") as NoteRow)).toEqual(note);
  });
});

describe("fetchNotes", () => {
  it("reads the notes table, newest first, and maps the rows", async () => {
    const row: NoteRow = { id: note.id, title: "T", plain_text: "T", content: null, updated_at: "2026-10-27T10:00:00.000Z" };
    const { client, calls } = fakeClient({ select: { data: [row], error: null } });

    const notes = await fetchNotes(client);

    expect(calls.find((c) => c.method === "from")?.args).toEqual(["notes"]);
    expect(calls.find((c) => c.method === "order")?.args).toEqual(["updated_at", { ascending: false }]);
    expect(notes).toEqual([rowToNote(row)]);
  });

  it("returns an empty list when the account has no notes", async () => {
    const { client } = fakeClient({ select: { data: null, error: null } });
    await expect(fetchNotes(client)).resolves.toEqual([]);
  });

  it("throws the database's message when the read fails", async () => {
    const { client } = fakeClient({ select: { data: null, error: { message: "permission denied" } } });
    await expect(fetchNotes(client)).rejects.toThrow("permission denied");
  });
});

describe("upsertNote", () => {
  it("writes the note with the owner id, matching on id", async () => {
    const { client, calls } = fakeClient();
    await upsertNote(client, "user-1", note);

    const upsert = calls.find((c) => c.method === "upsert");
    expect(upsert?.args[0]).toMatchObject({ id: note.id, user_id: "user-1", title: "Groceries" });
    expect(upsert?.args[1]).toEqual({ onConflict: "id" });
  });

  it("throws when the write is rejected", async () => {
    const { client } = fakeClient({ upsert: { error: { message: "row-level security violation" } } });
    await expect(upsertNote(client, "user-1", note)).rejects.toThrow("row-level security violation");
  });
});

describe("deleteCloudNote", () => {
  it("deletes only the row with that id", async () => {
    const { client, calls } = fakeClient();
    await deleteCloudNote(client, note.id);
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["id", note.id]);
  });

  it("throws when the delete fails", async () => {
    const { client } = fakeClient({ del: { error: { message: "network down" } } });
    await expect(deleteCloudNote(client, note.id)).rejects.toThrow("network down");
  });
});
