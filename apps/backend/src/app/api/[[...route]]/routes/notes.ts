import { createRoute } from '@hono/zod-openapi'
import {
  NoteListResponseModel,
  NoteResponseModel,
  NoteIdParamModel,
  CreateNoteModel,
  UpdateNoteModel,
} from '../../../core/notes.core'
import { ErrorResponseModel } from '../../../core/common.core'

export const listNotesRoute = createRoute({
  method: 'get',
  path: '/v1/notes',
  summary: 'List notes',
  description: 'Retrieve all notes, pinned first, sorted by updated_at desc',
  responses: {
    200: { content: { 'application/json': { schema: NoteListResponseModel } }, description: 'Notes retrieved' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})

export const getNoteRoute = createRoute({
  method: 'get',
  path: '/v1/notes/{id}',
  summary: 'Get a note',
  request: { params: NoteIdParamModel },
  responses: {
    200: { content: { 'application/json': { schema: NoteResponseModel } }, description: 'Note retrieved' },
    404: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})

export const createNoteRoute = createRoute({
  method: 'post',
  path: '/v1/notes',
  summary: 'Create a note',
  request: { body: { content: { 'application/json': { schema: CreateNoteModel } } } },
  responses: {
    201: { content: { 'application/json': { schema: NoteResponseModel } }, description: 'Note created' },
    400: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Bad request' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})

export const updateNoteRoute = createRoute({
  method: 'patch',
  path: '/v1/notes/{id}',
  summary: 'Update a note',
  description: 'Update title, body, or pinned status. Used by auto-save (debounced).',
  request: {
    params: NoteIdParamModel,
    body: { content: { 'application/json': { schema: UpdateNoteModel } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: NoteResponseModel } }, description: 'Note updated' },
    404: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})

export const deleteNoteRoute = createRoute({
  method: 'delete',
  path: '/v1/notes/{id}',
  summary: 'Delete a note',
  request: { params: NoteIdParamModel },
  responses: {
    200: { content: { 'application/json': { schema: NoteResponseModel } }, description: 'Note deleted' },
    404: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})
