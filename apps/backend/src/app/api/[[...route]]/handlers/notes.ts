import type { RouteHandler } from '@hono/zod-openapi'
import type { AppBindings } from '../types'
import { listNotesRoute, getNoteRoute, createNoteRoute, updateNoteRoute, deleteNoteRoute } from '../routes/notes'
import { getAllNotes, getNoteById, createNote, updateNote, deleteNote } from '../../../core/notes.db'

export const listNotesHandler: RouteHandler<typeof listNotesRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const notes = await getAllNotes(db, user.id)
    return c.json({ data: notes }, 200)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to fetch notes')
    return c.json({ error: 'Failed to fetch notes' }, 500)
  }
}

export const getNoteHandler: RouteHandler<typeof getNoteRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const note = await getNoteById(db, user.id, id)
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json({ data: note }, 200)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to fetch note')
    return c.json({ error: 'Failed to fetch note' }, 500)
  }
}

export const createNoteHandler: RouteHandler<typeof createNoteRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const data = c.req.valid('json')
    const note = await createNote(db, user.id, data)
    return c.json({ data: note }, 201)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to create note')
    return c.json({ error: 'Failed to create note' }, 500)
  }
}

export const updateNoteHandler: RouteHandler<typeof updateNoteRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const note = await updateNote(db, user.id, id, data)
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json({ data: note }, 200)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to update note')
    return c.json({ error: 'Failed to update note' }, 500)
  }
}

export const deleteNoteHandler: RouteHandler<typeof deleteNoteRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const note = await deleteNote(db, user.id, id)
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json({ data: note }, 200)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to delete note')
    return c.json({ error: 'Failed to delete note' }, 500)
  }
}
