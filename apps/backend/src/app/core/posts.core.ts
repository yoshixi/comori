import { z } from '@hono/zod-openapi'

const UuidSchema = z.string().uuid()
const UnixTimestampSchema = z.number().int().min(0)

// Linked event/todo summaries included in post responses
const LinkedEventModel = z.object({
  id: z.number().int(),
  title: z.string(),
})

const LinkedTodoModel = z.object({
  id: UuidSchema,
  title: z.string(),
})

export const PostModel = z.object({
  id: UuidSchema,
  body: z.string(),
  posted_at: UnixTimestampSchema,
  events: z.array(LinkedEventModel),
  todos: z.array(LinkedTodoModel),
}).openapi('Post')

export const CreatePostModel = z.object({
  body: z.string().min(1),
  posted_at: UnixTimestampSchema.optional().openapi({ description: 'Defaults to now if omitted' }),
  event_ids: z.array(z.number().int()).optional().default([]),
  todo_ids: z.array(UuidSchema).optional().default([]),
}).openapi('CreatePost')

export const UpdatePostModel = z.object({
  body: z.string().min(1).optional(),
  event_ids: z.array(z.number().int()).optional(),
  todo_ids: z.array(UuidSchema).optional(),
}).openapi('UpdatePost')

export const PostQueryParamsModel = z.object({
  from: z.coerce.number().int().openapi({ description: 'Range start (UTC Unix timestamp)' }),
  to: z.coerce.number().int().openapi({ description: 'Range end (UTC Unix timestamp)' }),
}).openapi('PostQueryParams')

export const PostIdParamModel = z.object({
  id: UuidSchema.openapi({ param: { name: 'id', in: 'path' } }),
}).openapi('PostIdParam')

export const PostListResponseModel = z.object({
  data: z.array(PostModel),
}).openapi('PostListResponse')

export const PostResponseModel = z.object({
  data: PostModel,
}).openapi('PostResponse')

export type Post = z.infer<typeof PostModel>
export type CreatePost = z.infer<typeof CreatePostModel>
export type UpdatePost = z.infer<typeof UpdatePostModel>
