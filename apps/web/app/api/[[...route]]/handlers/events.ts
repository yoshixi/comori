import type { RouteHandler } from '@hono/zod-openapi'
import { listEventsRoute, getEventRoute } from '../routes/events'
import { getDb } from '../../../core/common.db'
import { ensureDefaultUser } from '../../../core/tasks.db'
import { getAllEvents, getEventById } from '../../../core/events.db'

// GET /events - List events with filters
export const listEventsHandler: RouteHandler<typeof listEventsRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const query = c.req.valid('query')

    const events = await getAllEvents(db, defaultUser.id.toString(), {
      calendarId: query.calendarId,
      startDate: query.startDate,
      endDate: query.endDate
    })

    return c.json({ events, total: events.length }, 200)
  } catch (error) {
    console.error('Error listing events:', error)
    return c.json({ error: 'Failed to retrieve events' }, 500)
  }
}

// GET /events/{id} - Get a specific event
export const getEventHandler: RouteHandler<typeof getEventRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')

    const event = await getEventById(db, defaultUser.id.toString(), id)

    if (!event) {
      return c.json({ error: 'Event not found' }, 404)
    }

    return c.json({ event }, 200)
  } catch (error) {
    console.error('Error getting event:', error)
    return c.json({ error: 'Failed to retrieve event' }, 500)
  }
}
