import { useCallback, useMemo } from 'react'
import { useSWRConfig } from 'swr'
import {
  useGetApiOauthGoogleStatus,
  useGetApiCalendarsAvailable,
  useGetApiCalendars,
  postApiCalendars,
  patchApiCalendarsId,
  deleteApiCalendarsId,
  postApiCalendarsIdSync,
  getGetApiCalendarsKey,
  getGetApiCalendarsAvailableKey,
  getGetApiEventsKey,
  type AvailableCalendar,
  type Calendar
} from '../gen/api'

interface UseCalendarSettingsReturn {
  /** Whether Google OAuth is connected */
  isGoogleConnected: boolean
  /** Whether data is loading */
  isLoading: boolean
  /** Available calendars from Google (not yet synced) */
  availableCalendars: AvailableCalendar[]
  /** Synced calendars (in our DB) */
  syncedCalendars: Calendar[]
  /** Add a calendar to sync */
  addCalendar: (providerCalendarId: string, name: string) => Promise<void>
  /** Remove a calendar */
  removeCalendar: (calendarId: string) => Promise<void>
  /** Toggle calendar enabled state */
  toggleCalendarEnabled: (calendarId: string, enabled: boolean) => Promise<void>
  /** Sync a calendar */
  syncCalendar: (calendarId: string) => Promise<void>
  /** Refresh data */
  refresh: () => Promise<void>
}

export function useCalendarSettings(): UseCalendarSettingsReturn {
  const { mutate } = useSWRConfig()

  // Check Google OAuth status
  const { data: googleStatus, isLoading: isStatusLoading } = useGetApiOauthGoogleStatus()

  const isGoogleConnected = useMemo(
    () => googleStatus?.connected === true,
    [googleStatus?.connected]
  )

  // Get available calendars from Google
  const { data: availableData, isLoading: isAvailableLoading } = useGetApiCalendarsAvailable({
    swr: {
      enabled: isGoogleConnected
    }
  })

  // Get synced calendars from our DB
  const { data: syncedData, isLoading: isSyncedLoading } = useGetApiCalendars({
    swr: {
      enabled: isGoogleConnected
    }
  })

  const refresh = useCallback(async () => {
    await Promise.all([
      mutate(getGetApiCalendarsKey()),
      mutate(getGetApiCalendarsAvailableKey()),
      mutate(getGetApiEventsKey())
    ])
  }, [mutate])

  const addCalendar = useCallback(
    async (providerCalendarId: string, name: string) => {
      await postApiCalendars({
        providerCalendarId,
        name
      })
      await refresh()
    },
    [refresh]
  )

  const removeCalendar = useCallback(
    async (calendarId: string) => {
      const calendarIdNum = parseInt(calendarId, 10)
      await deleteApiCalendarsId(calendarIdNum)
      await refresh()
    },
    [refresh]
  )

  const toggleCalendarEnabled = useCallback(
    async (calendarId: string, enabled: boolean) => {
      const calendarIdNum = parseInt(calendarId, 10)
      await patchApiCalendarsId(calendarIdNum, { isEnabled: enabled })
      await mutate(getGetApiCalendarsKey())
    },
    [mutate]
  )

  const syncCalendar = useCallback(
    async (calendarId: string) => {
      const calendarIdNum = parseInt(calendarId, 10)
      await postApiCalendarsIdSync(calendarIdNum)
      await Promise.all([mutate(getGetApiCalendarsKey()), mutate(getGetApiEventsKey())])
    },
    [mutate]
  )

  return {
    isGoogleConnected,
    isLoading: isStatusLoading || isAvailableLoading || isSyncedLoading,
    availableCalendars: availableData?.calendars ?? [],
    syncedCalendars: syncedData?.calendars ?? [],
    addCalendar,
    removeCalendar,
    toggleCalendarEnabled,
    syncCalendar,
    refresh
  }
}
