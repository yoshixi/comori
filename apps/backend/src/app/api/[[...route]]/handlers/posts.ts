import type { RouteHandler } from '@hono/zod-openapi'
import type { AppBindings } from '../types'
import { listPostsRoute, createPostRoute, updatePostRoute, deletePostRoute } from '../routes/posts'
import { getPostsByRange, createPost, updatePost, deletePost } from '../../../core/posts.db'

export const listPostsHandler: RouteHandler<typeof listPostsRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const { from, to } = c.req.valid('query')
    const posts = await getPostsByRange(db, user.id, from, to)
    return c.json({ data: posts }, 200)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to fetch posts')
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
}

export const createPostHandler: RouteHandler<typeof createPostRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const data = c.req.valid('json')
    const post = await createPost(db, user.id, data)
    return c.json({ data: post }, 201)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to create post')
    return c.json({ error: 'Failed to create post' }, 500)
  }
}

export const updatePostHandler: RouteHandler<typeof updatePostRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const post = await updatePost(db, user.id, id, data)
    if (!post) return c.json({ error: 'Post not found' }, 404)
    return c.json({ data: post }, 200)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to update post')
    return c.json({ error: 'Failed to update post' }, 500)
  }
}

export const deletePostHandler: RouteHandler<typeof deletePostRoute, AppBindings> = async (c) => {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const post = await deletePost(db, user.id, id)
    if (!post) return c.json({ error: 'Post not found' }, 404)
    return c.json({ data: post }, 200)
  } catch (error) {
    c.get('logger').error({ err: error }, 'failed to delete post')
    return c.json({ error: 'Failed to delete post' }, 500)
  }
}
