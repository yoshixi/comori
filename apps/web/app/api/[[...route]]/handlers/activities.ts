import type { RouteHandler } from '@hono/zod-openapi'
import { getTaskActivitiesRoute } from '../routes/activities'
import { getDb } from '../../../core/common.db'
import { ensureDefaultUser } from '../../../core/tasks.db'
import { getTaskActivities } from '../../../core/activities.db'

export const getTaskActivitiesHandler: RouteHandler<typeof getTaskActivitiesRoute> = async (c) => {
  try {
    const db = getDb()
    const user = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')

    const activities = await getTaskActivities(db, user.id.toString(), id)
    if (!activities) {
      return c.json(
        {
          error: 'Not found',
          message: 'Task not found'
        },
        404
      )
    }

    return c.json({ activities }, 200)
  } catch (error) {
    console.error('Error fetching task activities:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch task activities'
      },
      500
    )
  }
}
