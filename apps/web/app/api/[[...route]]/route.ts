import { Hono } from 'hono'
import { handle } from 'hono/vercel'

// Import models and types for validation
import type {
  Task,
  CreateTask,
  UpdateTask,
  TaskQueryParams,
  TaskTimer,
  CreateTimer,
  UpdateTimer,
  ErrorResponse,
  HealthResponse
} from '../../models'

// Import database functions
import { 
  getDb, 
  ensureDefaultUser, 
  getAllTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../../db/tasks'
import {
  getAllTimers,
  getTimersByTaskId,
  getTimerById,
  createTimer,
  updateTimer,
  deleteTimer
} from '../../db/timers'

const app = new Hono().basePath('/api')

// Simple CORS headers middleware
app.use('/*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200)
  }
  
  await next()
})

// Health check route
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Shuchu API is running',
    timestamp: new Date().toISOString()
  })
})

// Task routes
app.get('/tasks', async (c) => {
  try {
    const status = c.req.query('status') || 'all'
    const db = getDb()
    const user = await ensureDefaultUser(db)
    
    const tasks = await getAllTasks(db, user.id, status)
    
    return c.json({
      tasks,
      total: tasks.length
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

app.get('/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = getDb()
    const user = await ensureDefaultUser(db)
    
    const task = await getTaskById(db, user.id, id)
    
    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    return c.json({ task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return c.json({ error: 'Failed to fetch task' }, 500)
  }
})

app.post('/tasks', async (c) => {
  try {
    const data = await c.req.json() as CreateTask
    const db = getDb()
    const user = await ensureDefaultUser(db)
    
    const task = await createTask(db, user.id, data)
    
    return c.json({ task }, 201)
  } catch (error) {
    console.error('Error creating task:', error)
    return c.json({ error: 'Failed to create task' }, 500)
  }
})

app.put('/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json() as UpdateTask
    const db = getDb()
    const user = await ensureDefaultUser(db)
    
    const task = await updateTask(db, user.id, id, data)
    
    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    return c.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return c.json({ error: 'Failed to update task' }, 500)
  }
})

app.delete('/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = getDb()
    const user = await ensureDefaultUser(db)
    
    const task = await deleteTask(db, user.id, id)
    
    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    return c.json({ task })
  } catch (error) {
    console.error('Error deleting task:', error)
    return c.json({ error: 'Failed to delete task' }, 500)
  }
})

// Timer routes
app.get('/timers', async (c) => {
  try {
    const db = getDb()
    const timers = await getAllTimers(db)
    
    return c.json({
      timers,
      total: timers.length
    })
  } catch (error) {
    console.error('Error fetching timers:', error)
    return c.json({ error: 'Failed to fetch timers' }, 500)
  }
})

app.get('/tasks/:taskId/timers', async (c) => {
  try {
    const taskId = c.req.param('taskId')
    const db = getDb()
    const user = await ensureDefaultUser(db)
    
    const timers = await getTimersByTaskId(db, user.id, taskId)
    
    if (timers === null) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    return c.json({
      timers,
      total: timers.length
    })
  } catch (error) {
    console.error('Error fetching task timers:', error)
    return c.json({ error: 'Failed to fetch task timers' }, 500)
  }
})

app.get('/timers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = getDb()
    
    const timer = await getTimerById(db, id)
    
    if (!timer) {
      return c.json({ error: 'Timer not found' }, 404)
    }
    
    return c.json({ timer })
  } catch (error) {
    console.error('Error fetching timer:', error)
    return c.json({ error: 'Failed to fetch timer' }, 500)
  }
})

app.post('/timers', async (c) => {
  try {
    const data = await c.req.json() as CreateTimer
    const db = getDb()
    const user = await ensureDefaultUser(db)
    
    const timer = await createTimer(db, user.id, data)
    
    if (!timer) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    return c.json({ timer }, 201)
  } catch (error) {
    console.error('Error creating timer:', error)
    return c.json({ error: 'Failed to create timer' }, 500)
  }
})

app.put('/timers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json() as UpdateTimer
    const db = getDb()
    
    const timer = await updateTimer(db, id, data)
    
    if (!timer) {
      return c.json({ error: 'Timer not found' }, 404)
    }
    
    return c.json({ timer })
  } catch (error) {
    console.error('Error updating timer:', error)
    return c.json({ error: 'Failed to update timer' }, 500)
  }
})

app.delete('/timers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = getDb()
    
    const timer = await deleteTimer(db, id)
    
    if (!timer) {
      return c.json({ error: 'Timer not found' }, 404)
    }
    
    return c.json({ timer })
  } catch (error) {
    console.error('Error deleting timer:', error)
    return c.json({ error: 'Failed to delete timer' }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)