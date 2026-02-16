import React, { useState } from 'react'
import {
  CalendarDays,
  CheckCircle,
  Plus,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { useCalendarSettings } from '../hooks/useCalendarSettings'
import type { AvailableCalendar, Calendar } from '../gen/api'

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-6 pb-5 pt-0">{children}</div>}
    </div>
  )
}

function CalendarColorDot({ color }: { color?: string | null }): React.JSX.Element {
  return (
    <div
      className="h-3 w-3 rounded-full shrink-0"
      style={{ backgroundColor: color ?? '#6366f1' }}
    />
  )
}

function AvailableCalendarItem({
  calendar,
  onAdd,
  isAdding
}: {
  calendar: AvailableCalendar
  onAdd: () => void
  isAdding: boolean
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-b-0">
      {/* Action button/badge on left side - always visible */}
      <div className="shrink-0 w-16">
        {calendar.isAlreadyAdded ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            Added
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onAdd}
            disabled={isAdding}
            className="h-7"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>
      {/* Calendar info - truncates when needed */}
      <CalendarColorDot color={calendar.color} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {calendar.name}
          {calendar.isPrimary && (
            <span className="ml-2 text-xs text-muted-foreground">(Primary)</span>
          )}
        </p>
      </div>
    </div>
  )
}

function SyncedCalendarItem({
  calendar,
  onToggleEnabled,
  onSync,
  onRemove,
  isSyncing,
  isRemoving
}: {
  calendar: Calendar
  onToggleEnabled: (enabled: boolean) => void
  onSync: () => void
  onRemove: () => void
  isSyncing: boolean
  isRemoving: boolean
}): React.JSX.Element {
  const lastSynced = calendar.lastSyncedAt
    ? new Date(calendar.lastSyncedAt).toLocaleString()
    : 'Never'

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <CalendarColorDot color={calendar.color} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{calendar.name}</p>
          <p className="text-xs text-muted-foreground">Last synced: {lastSynced}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={calendar.isEnabled}
          onCheckedChange={onToggleEnabled}
          aria-label={calendar.isEnabled ? 'Disable calendar' : 'Enable calendar'}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={onSync}
          disabled={isSyncing}
          title="Sync now"
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          disabled={isRemoving}
          title="Remove calendar"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function SettingsView(): React.JSX.Element {
  const {
    isGoogleConnected,
    isLoading,
    availableCalendars,
    syncedCalendars,
    addCalendar,
    removeCalendar,
    toggleCalendarEnabled,
    syncCalendar
  } = useCalendarSettings()

  const [addingCalendarId, setAddingCalendarId] = useState<string | null>(null)
  const [syncingCalendarId, setSyncingCalendarId] = useState<string | null>(null)
  const [removingCalendarId, setRemovingCalendarId] = useState<string | null>(null)

  const handleAddCalendar = async (calendar: AvailableCalendar): Promise<void> => {
    setAddingCalendarId(calendar.providerCalendarId)
    try {
      await addCalendar(calendar.providerCalendarId, calendar.name)
    } catch (error) {
      console.error('Failed to add calendar:', error)
    } finally {
      setAddingCalendarId(null)
    }
  }

  const handleSyncCalendar = async (calendarId: string): Promise<void> => {
    setSyncingCalendarId(calendarId)
    try {
      await syncCalendar(calendarId)
    } catch (error) {
      console.error('Failed to sync calendar:', error)
    } finally {
      setSyncingCalendarId(null)
    }
  }

  const handleRemoveCalendar = async (calendarId: string): Promise<void> => {
    setRemovingCalendarId(calendarId)
    try {
      await removeCalendar(calendarId)
    } catch (error) {
      console.error('Failed to remove calendar:', error)
    } finally {
      setRemovingCalendarId(null)
    }
  }

  const handleToggleEnabled = async (
    calendarId: string,
    enabled: boolean
  ): Promise<void> => {
    try {
      await toggleCalendarEnabled(calendarId, enabled)
    } catch (error) {
      console.error('Failed to toggle calendar:', error)
    }
  }

  return (
    <div className="p-8 overflow-auto flex-1 min-h-0">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
      <p className="mt-2 text-muted-foreground">
        Configure calendar integrations and sync preferences.
      </p>

      <div className="mt-8 space-y-6">
        {/* Google Calendar Connection Status */}
        <div className="border rounded-lg px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Google Calendar</p>
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? 'Checking connection...'
                    : isGoogleConnected
                      ? 'Connected'
                      : 'Not connected'}
                </p>
              </div>
            </div>
            {isGoogleConnected ? (
              <span className="flex items-center gap-1.5 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in with Google in Account to sync calendars
              </p>
            )}
          </div>
        </div>

        {/* Available Calendars - only show when connected */}
        {isGoogleConnected && (
          <CollapsibleSection
            title="Available Calendars"
            icon={<Plus className="h-5 w-5 text-muted-foreground" />}
            defaultOpen={syncedCalendars.length === 0}
          >
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-2">Loading calendars...</p>
            ) : availableCalendars.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No calendars found in your Google account.
              </p>
            ) : (
              <div className="divide-y">
                {availableCalendars.map((calendar) => (
                  <AvailableCalendarItem
                    key={calendar.providerCalendarId}
                    calendar={calendar}
                    onAdd={() => handleAddCalendar(calendar)}
                    isAdding={addingCalendarId === calendar.providerCalendarId}
                  />
                ))}
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Synced Calendars - only show when connected and has calendars */}
        {isGoogleConnected && syncedCalendars.length > 0 && (
          <CollapsibleSection
            title="Synced Calendars"
            icon={<CalendarDays className="h-5 w-5 text-muted-foreground" />}
            defaultOpen
          >
            <div className="divide-y">
              {syncedCalendars.map((calendar) => (
                <SyncedCalendarItem
                  key={calendar.id}
                  calendar={calendar}
                  onToggleEnabled={(enabled) => handleToggleEnabled(calendar.id, enabled)}
                  onSync={() => handleSyncCalendar(calendar.id)}
                  onRemove={() => handleRemoveCalendar(calendar.id)}
                  isSyncing={syncingCalendarId === calendar.id}
                  isRemoving={removingCalendarId === calendar.id}
                />
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}
