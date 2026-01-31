import type { RouteHandler } from '@hono/zod-openapi'
import { getTaskActivitiesRoute } from '../routes/activities'
import { getDb } from '../../../core/common.db'
import { getTaskActivities } from '../../../core/activities.db'
import { findOrCreateUserByProvider } from '../../../core/auth.db'

export const getTaskActivitiesHandler: RouteHandler<typeof getTaskActivitiesRoute> = async (c) => {
  try {
    const db = getDb()
    const auth = c.get('auth')
    const user = await findOrCreateUserByProvider(db, {
      provider: 'clerk',
      providerId: auth.userId,
      email: auth.email
    })
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
