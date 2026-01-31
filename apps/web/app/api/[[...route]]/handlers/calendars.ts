import type { RouteHandler } from '@hono/zod-openapi'
import { v4 as uuidv4 } from 'uuid'
import {
  listAvailableCalendarsRoute,
  listCalendarsRoute,
  createCalendarRoute,
  getCalendarRoute,
  updateCalendarRoute,
  deleteCalendarRoute,
  syncCalendarRoute,
  syncAllCalendarsRoute,
  watchCalendarRoute,
  stopWatchingCalendarRoute,
  getWatchStatusRoute
} from '../routes/calendars'
import { getDb } from '../../../core/common.db'
import { ensureDefaultUser } from '../../../core/tasks.db'
import { getOAuthToken, updateOAuthToken } from '../../../core/oauth.db'
import {
  getAllCalendars,
  getCalendarById,
  getCalendarByProviderId,
  getEnabledCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  updateCalendarLastSynced
} from '../../../core/calendars.db'
import { importEventsForCalendar } from '../../../core/events.db'
import {
  createWatchChannel,
  getWatchChannelByCalendarId,
  deleteWatchChannel
} from '../../../core/watch-channels.db'
import {
  googleCalendarProvider,
  getValidGoogleTokens
} from '../../../core/calendar-providers/google.service'
import type { ProviderTokens } from '../../../core/calendar-providers/types'
import { getCurrentUnixTimestamp } from '../../../core/common.core'

// Helper function to get valid tokens or throw error message
async function getValidTokensOrThrow(
  db: ReturnType<typeof getDb>,
  userId: string
): Promise<{ tokens: ProviderTokens } | { errorMessage: string }> {
  const token = await getOAuthToken(db, userId, 'google')
  if (!token) {
    return { errorMessage: 'Google OAuth not connected' }
  }

  const providerTokens: ProviderTokens = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: token.expiresAt
  }

  try {
    const validTokens = await getValidGoogleTokens(providerTokens)

    // Update tokens in DB if they were refreshed
    if (validTokens.accessToken !== token.accessToken) {
      await updateOAuthToken(db, userId, 'google', {
        accessToken: validTokens.accessToken,
        refreshToken: validTokens.refreshToken,
        expiresAt: validTokens.expiresAt
      })
    }

    return { tokens: validTokens }
  } catch (error) {
    console.error('Failed to refresh Google tokens:', error)
    return { errorMessage: 'Google OAuth token expired or invalid' }
  }
}

// GET /calendars/available - List available calendars from Google
export const listAvailableCalendarsHandler: RouteHandler<typeof listAvailableCalendarsRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const userId = defaultUser.id.toString()

    const tokensResult = await getValidTokensOrThrow(db, userId)
    if ('errorMessage' in tokensResult) {
      return c.json({ error: tokensResult.errorMessage }, 401)
    }

    // Get existing calendars to mark which ones are already added
    const existingCalendars = await getAllCalendars(db, userId, 'google')
    const existingProviderIds = new Set(existingCalendars.map((c) => c.providerCalendarId))

    // Fetch available calendars from Google
    const googleCalendars = await googleCalendarProvider.listCalendars(tokensResult.tokens)

    const availableCalendars = googleCalendars.map((cal) => ({
      providerCalendarId: cal.providerCalendarId,
      name: cal.name,
      color: cal.color,
      isPrimary: cal.isPrimary,
      isAlreadyAdded: existingProviderIds.has(cal.providerCalendarId)
    }))

    return c.json({ calendars: availableCalendars }, 200)
  } catch (error) {
    console.error('Error listing available calendars:', error)
    return c.json({ error: 'Failed to retrieve available calendars' }, 500)
  }
}

// GET /calendars - List integrated calendars
export const listCalendarsHandler: RouteHandler<typeof listCalendarsRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)

    const calendars = await getAllCalendars(db, defaultUser.id.toString())

    return c.json({ calendars, total: calendars.length }, 200)
  } catch (error) {
    console.error('Error listing calendars:', error)
    return c.json({ error: 'Failed to retrieve calendars' }, 500)
  }
}

// POST /calendars - Add a calendar to sync
export const createCalendarHandler: RouteHandler<typeof createCalendarRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const userId = defaultUser.id.toString()
    const data = c.req.valid('json')

    const tokensResult = await getValidTokensOrThrow(db, userId)
    if ('errorMessage' in tokensResult) {
      return c.json({ error: tokensResult.errorMessage }, 401)
    }

    // Check if calendar already exists
    const existingCalendar = await getCalendarByProviderId(
      db,
      userId,
      'google',
      data.providerCalendarId
    )
    if (existingCalendar) {
      return c.json({ error: 'Calendar already added' }, 400)
    }

    // Fetch calendar info from Google to get name and color
    const googleCalendars = await googleCalendarProvider.listCalendars(tokensResult.tokens)
    const googleCalendar = googleCalendars.find(
      (c) => c.providerCalendarId === data.providerCalendarId
    )

    if (!googleCalendar) {
      return c.json({ error: 'Calendar not found in Google account' }, 400)
    }

    const calendar = await createCalendar(
      db,
      userId,
      'google',
      data,
      googleCalendar.name,
      googleCalendar.color
    )

    return c.json({ calendar }, 201)
  } catch (error) {
    console.error('Error creating calendar:', error)
    return c.json({ error: 'Failed to add calendar' }, 500)
  }
}

// GET /calendars/{id} - Get a specific calendar
export const getCalendarHandler: RouteHandler<typeof getCalendarRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')

    const calendar = await getCalendarById(db, defaultUser.id.toString(), id)

    if (!calendar) {
      return c.json({ error: 'Calendar not found' }, 404)
    }

    return c.json({ calendar }, 200)
  } catch (error) {
    console.error('Error getting calendar:', error)
    return c.json({ error: 'Failed to retrieve calendar' }, 500)
  }
}

// PATCH /calendars/{id} - Update a calendar
export const updateCalendarHandler: RouteHandler<typeof updateCalendarRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    const calendar = await updateCalendar(db, defaultUser.id.toString(), id, data)

    if (!calendar) {
      return c.json({ error: 'Calendar not found' }, 404)
    }

    return c.json({ calendar }, 200)
  } catch (error) {
    console.error('Error updating calendar:', error)
    return c.json({ error: 'Failed to update calendar' }, 500)
  }
}

// DELETE /calendars/{id} - Remove a calendar
export const deleteCalendarHandler: RouteHandler<typeof deleteCalendarRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const { id } = c.req.valid('param')

    const calendar = await deleteCalendar(db, defaultUser.id.toString(), id)

    if (!calendar) {
      return c.json({ error: 'Calendar not found' }, 404)
    }

    return c.json({ calendar }, 200)
  } catch (error) {
    console.error('Error deleting calendar:', error)
    return c.json({ error: 'Failed to remove calendar' }, 500)
  }
}

// POST /calendars/{id}/sync - Sync a specific calendar
export const syncCalendarHandler: RouteHandler<typeof syncCalendarRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const userId = defaultUser.id.toString()
    const { id } = c.req.valid('param')

    const calendar = await getCalendarById(db, userId, id)
    if (!calendar) {
      return c.json({ error: 'Calendar not found' }, 404)
    }

    const tokensResult = await getValidTokensOrThrow(db, userId)
    if ('errorMessage' in tokensResult) {
      return c.json({ error: tokensResult.errorMessage }, 401)
    }

    // Fetch events for the next 30 days
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    const events = await googleCalendarProvider.listEvents(
      tokensResult.tokens,
      calendar.providerCalendarId,
      now,
      endDate
    )

    // Import events (full replace)
    const eventsCount = await importEventsForCalendar(
      db,
      calendar.id,
      'google',
      events
    )

    // Update last synced timestamp
    await updateCalendarLastSynced(db, calendar.id)

    return c.json(
      {
        success: true,
        message: `Synced ${eventsCount} events`,
        eventsCount
      },
      200
    )
  } catch (error) {
    console.error('Error syncing calendar:', error)
    return c.json({ error: 'Failed to sync calendar' }, 500)
  }
}

// POST /calendars/sync - Sync all enabled calendars
export const syncAllCalendarsHandler: RouteHandler<typeof syncAllCalendarsRoute> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const userId = defaultUser.id.toString()

    const tokensResult = await getValidTokensOrThrow(db, userId)
    if ('errorMessage' in tokensResult) {
      return c.json({ error: tokensResult.errorMessage }, 401)
    }

    const enabledCalendars = await getEnabledCalendars(db, userId, 'google')

    if (enabledCalendars.length === 0) {
      return c.json(
        {
          success: true,
          message: 'No enabled calendars to sync',
          eventsCount: 0
        },
        200
      )
    }

    // Sync each calendar
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    let totalEvents = 0
    for (const calendar of enabledCalendars) {
      try {
        const events = await googleCalendarProvider.listEvents(
          tokensResult.tokens,
          calendar.providerCalendarId,
          now,
          endDate
        )

        const count = await importEventsForCalendar(db, calendar.id, 'google', events)
        totalEvents += count

        await updateCalendarLastSynced(db, calendar.id)
      } catch (calError) {
        console.error(`Error syncing calendar ${calendar.id}:`, calError)
        // Continue with other calendars even if one fails
      }
    }

    return c.json(
      {
        success: true,
        message: `Synced ${totalEvents} events from ${enabledCalendars.length} calendars`,
        eventsCount: totalEvents
      },
      200
    )
  } catch (error) {
    console.error('Error syncing all calendars:', error)
    return c.json({ error: 'Failed to sync calendars' }, 500)
  }
}

// POST /calendars/{id}/watch - Start watching a calendar for changes
export const watchCalendarHandler: RouteHandler<
  typeof watchCalendarRoute
> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const userId = defaultUser.id.toString()
    const { id } = c.req.valid('param')

    const calendar = await getCalendarById(db, userId, id)
    if (!calendar) {
      return c.json({ error: 'Calendar not found' }, 404)
    }

    const tokensResult = await getValidTokensOrThrow(db, userId)
    if ('errorMessage' in tokensResult) {
      return c.json({ error: tokensResult.errorMessage }, 401)
    }

    // Check if there's already an active watch channel
    const existingChannel = await getWatchChannelByCalendarId(db, id, 'google')
    const now = getCurrentUnixTimestamp()
    if (existingChannel && existingChannel.expiresAt > now) {
      // Return existing channel
      return c.json({ watchChannel: existingChannel }, 200)
    }

    // Get webhook URL from environment or construct it
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL
    if (!webhookBaseUrl) {
      return c.json({ error: 'WEBHOOK_BASE_URL environment variable not set' }, 500)
    }
    const webhookUrl = `${webhookBaseUrl}/api/webhooks/google-calendar`

    // Generate a unique channel ID
    const channelId = uuidv4()

    // Generate a verification token
    const token = uuidv4()

    // Create watch channel with Google
    const watchResult = await googleCalendarProvider.watchCalendar!(
      tokensResult.tokens,
      calendar.providerCalendarId,
      webhookUrl,
      channelId,
      token
    )

    // Store the watch channel in database
    const watchChannel = await createWatchChannel(
      db,
      id,
      'google',
      watchResult.channelId,
      watchResult.resourceId,
      watchResult.expiresAt,
      token
    )

    return c.json({ watchChannel }, 200)
  } catch (error) {
    console.error('Error creating watch channel:', error)
    return c.json({ error: 'Failed to create watch channel' }, 500)
  }
}

// DELETE /calendars/{id}/watch - Stop watching a calendar
export const stopWatchingCalendarHandler: RouteHandler<
  typeof stopWatchingCalendarRoute
> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const userId = defaultUser.id.toString()
    const { id } = c.req.valid('param')

    const calendar = await getCalendarById(db, userId, id)
    if (!calendar) {
      return c.json({ error: 'Calendar not found' }, 404)
    }

    const watchChannel = await getWatchChannelByCalendarId(db, id, 'google')
    if (!watchChannel) {
      return c.json({ error: 'No watch channel found for this calendar' }, 404)
    }

    const tokensResult = await getValidTokensOrThrow(db, userId)
    if ('errorMessage' in tokensResult) {
      return c.json({ error: tokensResult.errorMessage }, 401)
    }

    // Stop watching with Google
    try {
      await googleCalendarProvider.stopWatching!(tokensResult.tokens, {
        channelId: watchChannel.channelId,
        resourceId: watchChannel.resourceId
      })
    } catch (stopError) {
      // Log but continue - channel may already be expired on Google's side
      console.warn('Error stopping watch channel with Google:', stopError)
    }

    // Delete from database
    await deleteWatchChannel(db, id, 'google')

    return c.json(
      { success: true, message: 'Watch channel stopped successfully' },
      200
    )
  } catch (error) {
    console.error('Error stopping watch channel:', error)
    return c.json({ error: 'Failed to stop watch channel' }, 500)
  }
}

// GET /calendars/{id}/watch - Get watch channel status
export const getWatchStatusHandler: RouteHandler<
  typeof getWatchStatusRoute
> = async (c) => {
  try {
    const db = getDb()
    const defaultUser = await ensureDefaultUser(db)
    const userId = defaultUser.id.toString()
    const { id } = c.req.valid('param')

    const calendar = await getCalendarById(db, userId, id)
    if (!calendar) {
      return c.json({ error: 'Calendar not found' }, 404)
    }

    const watchChannel = await getWatchChannelByCalendarId(db, id, 'google')

    if (!watchChannel) {
      return c.json(
        { isWatching: false, watchChannel: null, expiresIn: null },
        200
      )
    }

    const now = getCurrentUnixTimestamp()
    const isActive = watchChannel.expiresAt > now
    const expiresIn = isActive ? watchChannel.expiresAt - now : null

    return c.json(
      {
        isWatching: isActive,
        watchChannel: isActive ? watchChannel : null,
        expiresIn
      },
      200
    )
  } catch (error) {
    console.error('Error getting watch status:', error)
    return c.json({ error: 'Failed to retrieve watch status' }, 500)
  }
}
