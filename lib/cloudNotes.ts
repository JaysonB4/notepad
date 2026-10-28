import type { SupabaseClient } from "@supabase/supabase-js";
import type { JSONContent } from "@tiptap/react";
import type { Note } from "./storage";

/** The table in Supabase that holds account notes. See supabase/schema.sql. */
export const NOTES_TABLE = "notes";

/** A row in the notes table, using the column names in the database. */
export type NoteRow = {
  id: string;
  user_id?: string;
  title: string;
  plain_text: string;
  content: JSONContent | null;
  updated_at: string;
};

export function rowToNote(row: NoteRow): Note {
  const updatedAt = Date.parse(row.updated_at);
  return {
    id: row.id,
    title: row.title ?? "",
    text: row.plain_text ?? "",
    content: row.content ?? null,
    updatedAt: Number.isNaN(updatedAt) ? Date.now() : updatedAt,
  };
}

export function noteToRow(note: Note, userId: string): NoteRow {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    plain_text: note.text,
    content: note.content,
    updated_at: new Date(note.updatedAt).toISOString(),
  };
}

/** Every note in the signed-in account, newest first. Row-level security limits this to the user. */
export async function fetchNotes(client: SupabaseClient): Promise<Note[]> {
  const { data, error } = await client
    .from(NOTES_TABLE)
    .select("id,title,plain_text,content,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as NoteRow[]).map(rowToNote);
}

/** Creates or replaces one account note. */
export async function upsertNote(client: SupabaseClient, userId: string, note: Note): Promise<void> {
  const { error } = await client.from(NOTES_TABLE).upsert(noteToRow(note, userId), { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function deleteCloudNote(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from(NOTES_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
