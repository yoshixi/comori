import type { RouteHandler } from '@hono/zod-openapi'
import {
  listTasksRoute,
  getTaskRoute,
  createTaskRoute,
  updateTaskRoute,
  deleteTaskRoute
} from '../routes/tasks'
import { getDb } from '../../../core/common.db'
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask } from '../../../core/tasks.db'
import { findOrCreateUserByProvider } from '../../../core/auth.db'

// Task handlers
export const listTasksHandler: RouteHandler<typeof listTasksRoute> = async (c) => {
  try {
    const db = getDb()
    const auth = c.get('auth')
    const user = await findOrCreateUserByProvider(db, {
      provider: 'clerk',
      providerId: auth.userId,
      email: auth.email
    })
    // Validate and extract query parameters using the TaskQueryParamsModel schema
    const { completed, hasActiveTimer, scheduled, startAtFrom, startAtTo, sortBy, order, nullsLast, tags } = c.req.valid('query')

    const tasks = await getAllTasks(db, user.id.toString(), { completed, hasActiveTimer, scheduled, startAtFrom, startAtTo, sortBy, order, nullsLast, tags })

    return c.json(
      {
        tasks: tasks,
        total: tasks.length
      },
      200
    )
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch tasks'
      },
      500
    )
  }
}

export const getTaskHandler: RouteHandler<typeof getTaskRoute> = async (c) => {
  try {
    const db = getDb()
    const auth = c.get('auth')
    const user = await findOrCreateUserByProvider(db, {
      provider: 'clerk',
      providerId: auth.userId,
      email: auth.email
    })
    const { id } = c.req.valid('param')

    const task = await getTaskById(db, user.id.toString(), id)
    
    if (!task) {
      return c.json(
        {
          error: 'Not found',
          message: 'Task not found'
        },
        404
      )
    }
    
    return c.json({ task }, 200)
  } catch (error) {
    console.error('Error fetching task:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch task'
      },
      500
    )
  }
}

export const createTaskHandler: RouteHandler<typeof createTaskRoute> = async (c) => {
  try {
    const db = getDb()
    const auth = c.get('auth')
    const user = await findOrCreateUserByProvider(db, {
      provider: 'clerk',
      providerId: auth.userId,
      email: auth.email
    })
    const data = c.req.valid('json')

    const task = await createTask(db, user.id.toString(), data)
    
    return c.json({ task }, 201)
  } catch (error) {
    console.error('Error creating task:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to create task'
      },
      500
    )
  }
}

export const updateTaskHandler: RouteHandler<typeof updateTaskRoute> = async (c) => {
  try {
    const db = getDb()
    const auth = c.get('auth')
    const user = await findOrCreateUserByProvider(db, {
      provider: 'clerk',
      providerId: auth.userId,
      email: auth.email
    })
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    const task = await updateTask(db, user.id.toString(), id, data)
    
    if (!task) {
      return c.json(
        {
          error: 'Not found',
          message: 'Task not found'
        },
        404
      )
    }
    
    return c.json({ task }, 200)
  } catch (error) {
    console.error('Error updating task:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to update task'
      },
      500
    )
  }
}

export const deleteTaskHandler: RouteHandler<typeof deleteTaskRoute> = async (c) => {
  try {
    const db = getDb()
    const auth = c.get('auth')
    const user = await findOrCreateUserByProvider(db, {
      provider: 'clerk',
      providerId: auth.userId,
      email: auth.email
    })
    const { id } = c.req.valid('param')

    const task = await deleteTask(db, user.id.toString(), id)
    
    if (!task) {
      return c.json(
        {
          error: 'Not found',
          message: 'Task not found'
        },
        404
      )
    }
    
    return c.json({ task }, 200)
  } catch (error) {
    console.error('Error deleting task:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete task'
      },
      500
    )
  }
}
