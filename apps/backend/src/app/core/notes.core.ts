import { z } from '@hono/zod-openapi'
import { IdSchema } from './common.core'
import { TaskModel } from './tasks.core'

// Base note model
export const NoteModel = z.object({
  id: IdSchema.openapi({
    description: 'Unique identifier for the note'
  }),
  title: z.string().min(1).max(200).openapi({
    description: 'Title of the note',
    example: 'Quick idea about auth flow'
  }),
  content: z.string().nullable().openapi({
    description: 'Content of the note',
    example: 'Maybe we should use OAuth2 instead of session tokens'
  }),
  archivedAt: z.iso.datetime().nullable().openapi({
    description: 'Timestamp when the note was archived (converted to task)',
    example: null
  }),
  createdAt: z.iso.datetime().openapi({
    description: 'Timestamp when the note was created',
    example: '2024-01-01T10:00:00.000Z'
  }),
  updatedAt: z.iso.datetime().openapi({
    description: 'Timestamp when the note was last updated',
    example: '2024-01-01T15:30:00.000Z'
  })
}).openapi('Note')

// Create note input model
export const CreateNoteModel = z.object({
  title: z.string().min(1, 'Title is required').max(200).openapi({
    description: 'Title of the note',
    example: 'Quick idea about auth flow'
  }),
  content: z.string().optional().openapi({
    description: 'Content of the note',
    example: 'Maybe we should use OAuth2 instead of session tokens'
  })
}).openapi('CreateNote')

// Update note input model
export const UpdateNoteModel = z.object({
  title: z.string().min(1).max(200).optional().openapi({
    description: 'Title of the note',
    example: 'Updated idea about auth flow'
  }),
  content: z.string().optional().nullable().openapi({
    description: 'Content of the note',
    example: 'We should definitely use OAuth2'
  })
}).openapi('UpdateNote')

// Note list response model
export const NoteListResponseModel = z.object({
  notes: z.array(NoteModel).openapi({
    description: 'List of notes'
  }),
  total: z.number().int().min(0).openapi({
    description: 'Total number of notes',
    example: 5
  })
}).openapi('NoteListResponse')

// Single note response model
export const NoteResponseModel = z.object({
  note: NoteModel
}).openapi('NoteResponse')

// Note query parameters
const BooleanQueryParam = z.enum(['true', 'false']).transform(v => v === 'true')

export const NoteQueryParamsModel = z.object({
  includeArchived: BooleanQueryParam.optional().openapi({
    description: 'Include archived notes in the list',
    example: false
  })
}).openapi('NoteQueryParams')

// Path parameter models
export const NoteIdParamModel = z.object({
  id: IdSchema.openapi({
    description: 'Note ID',
    param: {
      name: 'id',
      in: 'path'
    }
  })
}).openapi('NoteIdParam')

// Convert note to task request model (optional schedule)
export const ConvertNoteToTaskRequestModel = z.object({
  startAt: z.iso.datetime().optional().openapi({
    description: 'Start date for the task in ISO 8601 format',
    example: '2024-01-01T09:00:00.000Z'
  }),
  endAt: z.iso.datetime().optional().openapi({
    description: 'End date for the task in ISO 8601 format',
    example: '2024-01-01T10:00:00.000Z'
  })
}).openapi('ConvertNoteToTaskRequest')

// Convert note to task response model
export const ConvertNoteToTaskResponseModel = z.object({
  task: TaskModel,
  note: NoteModel
}).openapi('ConvertNoteToTaskResponse')

// Export types
export type Note = z.infer<typeof NoteModel>
export type CreateNote = z.infer<typeof CreateNoteModel>
export type UpdateNote = z.infer<typeof UpdateNoteModel>
export type NoteListResponse = z.infer<typeof NoteListResponseModel>
export type NoteResponse = z.infer<typeof NoteResponseModel>
export type NoteQueryParams = z.infer<typeof NoteQueryParamsModel>
export type NoteIdParam = z.infer<typeof NoteIdParamModel>
export type ConvertNoteToTaskResponse = z.infer<typeof ConvertNoteToTaskResponseModel>
