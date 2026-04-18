import { z } from '@hono/zod-openapi'
import { ErrorResponseModel } from './common.core'

// UUID schema for new domain entities
const UuidSchema = z.string().uuid().openapi({
  description: 'UUID identifier',
  example: '550e8400-e29b-41d4-a716-446655440000',
})

// Unix timestamp schema
const UnixTimestampSchema = z.number().int().min(0).openapi({
  description: 'UTC Unix timestamp (seconds)',
  example: 1712300400,
})

// Todo model
export const TodoModel = z.object({
  id: UuidSchema,
  title: z.string().openapi({ example: 'Reply to client email' }),
  description: z.string().nullable().optional().openapi({ description: 'Optional longer notes for this todo' }),
  starts_at: UnixTimestampSchema.nullable().openapi({ description: 'Start time (nullable for unscheduled todos)' }),
  ends_at: UnixTimestampSchema.nullable().openapi({ description: 'End time (nullable)' }),
  is_all_day: z.number().int().min(0).max(1).openapi({ description: '1 = all-day todo' }),
  done: z.number().int().min(0).max(1).openapi({ description: '1 = completed' }),
  done_at: UnixTimestampSchema.nullable(),
  created_at: UnixTimestampSchema,
}).openapi('Todo')

export const CreateTodoModel = z.object({
  title: z.string().min(1).openapi({ example: 'Reply to client email' }),
  description: z.string().nullable().optional(),
  starts_at: UnixTimestampSchema.optional(),
  ends_at: UnixTimestampSchema.optional(),
  is_all_day: z.number().int().min(0).max(1).optional().default(0),
}).openapi('CreateTodo')

export const UpdateTodoModel = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  starts_at: UnixTimestampSchema.nullable().optional(),
  ends_at: UnixTimestampSchema.nullable().optional(),
  is_all_day: z.number().int().min(0).max(1).optional(),
  done: z.number().int().min(0).max(1).optional(),
}).openapi('UpdateTodo')

export const TodoQueryParamsModel = z.object({
  from: z.coerce.number().int().optional().openapi({ description: 'Range start (UTC Unix timestamp)' }),
  to: z.coerce.number().int().optional().openapi({ description: 'Range end (UTC Unix timestamp)' }),
  done: z.enum(['true', 'false']).optional().openapi({ description: 'Filter by completion status' }),
  limit: z.coerce.number().int().min(1).max(500).optional().openapi({
    description: 'Max rows to return (default 100, max 500)',
  }),
}).openapi('TodoQueryParams')

export const TodoIdParamModel = z.object({
  id: UuidSchema.openapi({ param: { name: 'id', in: 'path' } }),
}).openapi('TodoIdParam')

export const TodoListResponseModel = z.object({
  data: z.array(TodoModel),
}).openapi('TodoListResponse')

export const TodoResponseModel = z.object({
  data: TodoModel,
}).openapi('TodoResponse')

// Types
export type Todo = z.infer<typeof TodoModel>
export type CreateTodo = z.infer<typeof CreateTodoModel>
export type UpdateTodo = z.infer<typeof UpdateTodoModel>
