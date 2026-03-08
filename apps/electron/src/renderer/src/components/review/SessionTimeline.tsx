import React from 'react'
import { Badge } from '../ui/badge'
import { formatDurationShort } from '../../lib/timer-aggregation'
import type { SessionTimelineEntry } from '../../lib/timer-aggregation'
import type { Task } from '../../gen/api'

interface SessionTimelineProps {
  sessions: SessionTimelineEntry[]
  onTaskSelect: (task: Task) => void
  showLiveIndicator?: boolean
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function SessionTimeline({
  sessions,
  onTaskSelect,
  showLiveIndicator = false
}: SessionTimelineProps): React.JSX.Element {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No sessions recorded.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {sessions.map((entry) => {
        const isActive = !entry.timer.endTime
        return (
          <div
            key={entry.timer.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onTaskSelect(entry.task)}
          >
            {/* Time column */}
            <div className="flex flex-col items-end text-xs text-muted-foreground w-[100px] shrink-0 font-mono">
              <span>{formatTime(entry.timer.startTime)}</span>
              <span>
                {entry.timer.endTime ? formatTime(entry.timer.endTime) : ''}
              </span>
            </div>

            {/* Live indicator or duration */}
            <div className="w-[60px] shrink-0 text-right">
              {isActive && showLiveIndicator ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  live
                </span>
              ) : (
                <span className="text-sm font-mono font-medium">
                  {formatDurationShort(entry.durationMs)}
                </span>
              )}
            </div>

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{entry.task.title}</div>
              {entry.task.tags && entry.task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {entry.task.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
