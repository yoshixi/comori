import { eq, and, desc, isNull } from 'drizzle-orm'
import { notesTable, noteTaskConversionsTable, type InsertNote, type SelectNote, type InsertNoteTaskConversion } from '../db/schema/schema'
import { type DB } from './common.db'
import { formatTimestamp, getCurrentTimestamp, validateRequiredString } from './common.core'

// Define API types without zod dependencies
export interface Note {
  id: number
  title: string
  content: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateNote {
  title: string
  content?: string
}

export interface UpdateNote {
  title?: string
  content?: string | null
}

// Convert database note to API note
export function convertDbNoteToApi(dbNote: SelectNote): Note {
  return {
    id: dbNote.id,
    title: dbNote.title,
    content: dbNote.content ?? null,
    archivedAt: dbNote.archivedAt ? formatTimestamp(dbNote.archivedAt) : null,
    createdAt: formatTimestamp(dbNote.createdAt),
    updatedAt: formatTimestamp(dbNote.updatedAt)
  }
}

// Note database functions
export async function getAllNotes(db: DB, userId: number, includeArchived = false): Promise<Note[]> {
  const conditions = [eq(notesTable.userId, userId)]
  if (!includeArchived) {
    conditions.push(isNull(notesTable.archivedAt))
  }

  const dbNotes = await db
    .select()
    .from(notesTable)
    .where(and(...conditions))
    .orderBy(desc(notesTable.updatedAt))

  return dbNotes.map(convertDbNoteToApi)
}

export async function getNoteById(db: DB, userId: number, noteId: number): Promise<Note | null> {
  const [dbNote] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))

  if (!dbNote) {
    return null
  }

  return convertDbNoteToApi(dbNote)
}

export async function createNote(db: DB, userId: number, data: CreateNote): Promise<Note> {
  const now = getCurrentTimestamp()
  const noteData: InsertNote = {
    userId: userId,
    title: validateRequiredString(data.title, 'Note title'),
    content: data.content?.trim() || null,
    createdAt: now,
    updatedAt: now
  }

  const result = await db.insert(notesTable).values(noteData).returning()
  const dbNote = result[0]
  if (!dbNote) {
    throw new Error('Failed to create note')
  }
  return convertDbNoteToApi(dbNote)
}

export async function updateNote(db: DB, userId: number, noteId: number, data: UpdateNote): Promise<Note | null> {
  // Check if note exists and belongs to user
  const [existingNote] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))

  if (!existingNote) {
    return null
  }

  const now = getCurrentTimestamp()
  const updateData: Partial<InsertNote> = {
    updatedAt: now
  }

  if (data.title !== undefined) {
    updateData.title = validateRequiredString(data.title, 'Note title')
  }

  if (data.content !== undefined) {
    updateData.content = data.content === null ? null : (data.content.trim() || null)
  }

  const result = await db
    .update(notesTable)
    .set(updateData)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
    .returning()

  const updatedDbNote = result[0]
  if (!updatedDbNote) {
    return null
  }

  return convertDbNoteToApi(updatedDbNote)
}

export async function deleteNote(db: DB, userId: number, noteId: number): Promise<Note | null> {
  const [existingNote] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))

  if (!existingNote) {
    return null
  }

  const result = await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
    .returning()

  const deletedNote = result[0]
  if (!deletedNote) {
    return null
  }

  return convertDbNoteToApi(deletedNote)
}

export async function archiveNote(db: DB, userId: number, noteId: number): Promise<Note | null> {
  const now = getCurrentTimestamp()

  const result = await db
    .update(notesTable)
    .set({ archivedAt: now, updatedAt: now })
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
    .returning()

  const archivedDbNote = result[0]
  if (!archivedDbNote) {
    return null
  }

  return convertDbNoteToApi(archivedDbNote)
}

export async function recordConversion(db: DB, noteId: number, taskId: number): Promise<void> {
  const now = getCurrentTimestamp()
  const conversionData: InsertNoteTaskConversion = {
    noteId,
    taskId,
    createdAt: now
  }

  await db.insert(noteTaskConversionsTable).values(conversionData)
}
