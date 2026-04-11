import { z } from '@hono/zod-openapi'

const UuidSchema = z.string().uuid()
const UnixTimestampSchema = z.number().int().min(0)

export const NoteModel = z.object({
  id: UuidSchema,
  title: z.string().openapi({ example: 'Quick idea about auth flow' }),
  body: z.string().nullable().openapi({ description: 'Full Markdown content' }),
  pinned: z.number().int().min(0).max(1).openapi({ description: '1 = pinned to top' }),
  created_at: UnixTimestampSchema,
  updated_at: UnixTimestampSchema,
}).openapi('Note')

export const CreateNoteModel = z.object({
  title: z.string().min(1).max(200).openapi({ example: 'Meeting notes' }),
  body: z.string().optional(),
}).openapi('CreateNote')

export const UpdateNoteModel = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().nullable().optional(),
  pinned: z.number().int().min(0).max(1).optional(),
}).openapi('UpdateNote')

export const NoteIdParamModel = z.object({
  id: UuidSchema.openapi({ param: { name: 'id', in: 'path' } }),
}).openapi('NoteIdParam')

export const NoteListResponseModel = z.object({
  data: z.array(NoteModel),
}).openapi('NoteListResponse')

export const NoteResponseModel = z.object({
  data: NoteModel,
}).openapi('NoteResponse')

export type Note = z.infer<typeof NoteModel>
export type CreateNote = z.infer<typeof CreateNoteModel>
export type UpdateNote = z.infer<typeof UpdateNoteModel>
