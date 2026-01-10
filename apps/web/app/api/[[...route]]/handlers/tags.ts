import type { RouteHandler } from '@hono/zod-openapi'
import {
  listTagsRoute,
  getTagRoute,
  createTagRoute,
  updateTagRoute,
  deleteTagRoute
} from '../routes/tags'
import { getDb } from '../../../core/common.db'
import { ensureDefaultUser } from '../../../core/tasks.db'
import { getAllTags, getTagById, createTag, updateTag, deleteTag } from '../../../core/tags.db'

// Tag handlers
export const listTagsHandler: RouteHandler<typeof listTagsRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)

    const tags = await getAllTags(db, defaultUser.id.toString())

    return c.json(
      {
        tags: tags,
        total: tags.length
      },
      200
    )
  } catch (error) {
    console.error('Error fetching tags:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch tags'
      },
      500
    )
  }
}

export const getTagHandler: RouteHandler<typeof getTagRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')

    const tag = await getTagById(db, defaultUser.id.toString(), id)

    if (!tag) {
      return c.json(
        {
          error: 'Not found',
          message: 'Tag not found'
        },
        404
      )
    }

    return c.json({ tag }, 200)
  } catch (error) {
    console.error('Error fetching tag:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch tag'
      },
      500
    )
  }
}

export const createTagHandler: RouteHandler<typeof createTagRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const data = c.req.valid('json')

    const tag = await createTag(db, defaultUser.id.toString(), data)

    return c.json({ tag }, 201)
  } catch (error) {
    console.error('Error creating tag:', error, 'Type:', typeof error, 'Error object:', JSON.stringify(error, null, 2))

    // Handle unique constraint violation (duplicate tag name)
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    const errorCode = (error as any)?.code || ''

    if (errorMessage.includes('unique') ||
        errorMessage.includes('constraint') ||
        errorMessage.includes('sqlite_constraint') ||
        errorCode.includes('UNIQUE') ||
        errorCode === 'SQLITE_CONSTRAINT' ||
        errorCode === 'SQLITE_CONSTRAINT_UNIQUE' ||
        errorCode === 2067) {
      return c.json(
        {
          error: 'Bad request',
          message: 'A tag with this name already exists'
        },
        400
      )
    }

    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to create tag'
      },
      500
    )
  }
}

export const updateTagHandler: RouteHandler<typeof updateTagRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    const tag = await updateTag(db, defaultUser.id.toString(), id, data)

    if (!tag) {
      return c.json(
        {
          error: 'Not found',
          message: 'Tag not found'
        },
        404
      )
    }

    return c.json({ tag }, 200)
  } catch (error) {
    console.error('Error updating tag:', error, 'Type:', typeof error, 'Error object:', JSON.stringify(error, null, 2))

    // Handle unique constraint violation
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    const errorCode = (error as any)?.code || ''

    if (errorMessage.includes('unique') ||
        errorMessage.includes('constraint') ||
        errorMessage.includes('sqlite_constraint') ||
        errorCode.includes('UNIQUE') ||
        errorCode === 'SQLITE_CONSTRAINT' ||
        errorCode === 'SQLITE_CONSTRAINT_UNIQUE' ||
        errorCode === 2067) {
      return c.json(
        {
          error: 'Bad request',
          message: 'A tag with this name already exists'
        },
        400
      )
    }

    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to update tag'
      },
      500
    )
  }
}

export const deleteTagHandler: RouteHandler<typeof deleteTagRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')

    const tag = await deleteTag(db, defaultUser.id.toString(), id)

    if (!tag) {
      return c.json(
        {
          error: 'Not found',
          message: 'Tag not found'
        },
        404
      )
    }

    return c.json({ tag }, 200)
  } catch (error) {
    console.error('Error deleting tag:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete tag'
      },
      500
    )
  }
}
