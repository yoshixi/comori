import React, { useMemo, useRef, useEffect } from 'react'
import { Badge } from '../ui/badge'
import { formatDurationShort } from '../../lib/timer-aggregation'
import type { SessionTimelineEntry } from '../../lib/timer-aggregation'
import type { Task } from '../../gen/api'
import {
  MINUTES_PER_DAY,
  HOUR_LABEL_VERTICAL_OFFSET,
  clamp,
  formatHourLabel,
  formatTimeRange
} from '../../lib/calendar-utils'

interface DayTimelineProps {
  sessions: SessionTimelineEntry[]
  onTaskSelect: (task: Task) => void
  showLiveIndicator?: boolean
  /** Start hour to auto-scroll to (default: earliest session or 8) */
  scrollToHour?: number
}

// Fixed layout constants for a compact read-only timeline
const SLOT_MINUTES = 15
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES
const SLOT_COUNT = MINUTES_PER_DAY / SLOT_MINUTES
const SLOT_HEIGHT = 12 // px — compact so the full day fits reasonably
const TOTAL_HEIGHT = SLOT_COUNT * SLOT_HEIGHT // 1152px for 24h

interface SessionLayout {
  entry: SessionTimelineEntry
  startSlot: number
  endSlot: number
  lane: number
  laneCount: number
}

function calculateSessionLayouts(sessions: SessionTimelineEntry[]): SessionLayout[] {
  const items: SessionLayout[] = sessions.map((entry) => {
    const start = new Date(entry.timer.startTime)
    const end = entry.timer.endTime ? new Date(entry.timer.endTime) : new Date()
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()

    const startSlot = clamp(Math.floor(startMinutes / SLOT_MINUTES), 0, SLOT_COUNT - 1)
    const endSlot = clamp(Math.ceil(endMinutes / SLOT_MINUTES), startSlot + 1, SLOT_COUNT)

    return { entry, startSlot, endSlot, lane: 0, laneCount: 1 }
  })

  // Assign lanes for overlapping sessions
  const sorted = [...items].sort((a, b) => {
    if (a.startSlot === b.startSlot) return a.endSlot - b.endSlot
    return a.startSlot - b.startSlot
  })

  const lanesEnd: number[] = []
  sorted.forEach((item) => {
    let laneIndex = lanesEnd.findIndex((endSlot) => item.startSlot >= endSlot)
    if (laneIndex === -1) {
      laneIndex = lanesEnd.length
      lanesEnd.push(item.endSlot)
    } else {
      lanesEnd[laneIndex] = item.endSlot
    }
    item.lane = laneIndex
  })

  const laneCount = Math.max(lanesEnd.length, 1)
  return sorted.map((item) => ({ ...item, laneCount }))
}

export function DayTimeline({
  sessions,
  onTaskSelect,
  showLiveIndicator = false,
  scrollToHour
}: DayTimelineProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  const layouts = useMemo(() => calculateSessionLayouts(sessions), [sessions])

  // Determine the hour to scroll to
  const targetHour = useMemo(() => {
    if (scrollToHour !== undefined) return scrollToHour
    if (layouts.length === 0) return 8
    const earliest = Math.min(...layouts.map((l) => l.startSlot))
    const hour = Math.floor((earliest * SLOT_MINUTES) / 60)
    return Math.max(0, hour - 1) // 1 hour padding above
  }, [layouts, scrollToHour])

  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = targetHour * SLOTS_PER_HOUR * SLOT_HEIGHT
      scrollRef.current.scrollTop = scrollTo
    }
  }, [targetHour])

  // Current time indicator
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = clamp((nowMinutes / SLOT_MINUTES) * SLOT_HEIGHT, 0, TOTAL_HEIGHT)

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No sessions recorded.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div ref={scrollRef} className="overflow-y-auto max-h-[400px]">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          {/* Hour labels gutter */}
          <div className="relative w-10 flex-shrink-0">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="absolute left-1 text-[10px] text-muted-foreground"
                style={{ top: hour * SLOTS_PER_HOUR * SLOT_HEIGHT - HOUR_LABEL_VERTICAL_OFFSET }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Timeline column */}
          <div className="relative flex-1">
            {/* Hour grid lines */}
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={`line-${hour}`}
                className="absolute left-0 right-0 border-t border-muted-foreground/15"
                style={{ top: hour * SLOTS_PER_HOUR * SLOT_HEIGHT }}
              />
            ))}

            {/* Current time indicator */}
            {showLiveIndicator && (
              <div
                className="absolute left-0 right-0 z-20 h-px bg-primary/70"
                style={{ top: nowTop }}
              >
                <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
              </div>
            )}

            {/* Session blocks */}
            {layouts.map((layout) => {
              const top = layout.startSlot * SLOT_HEIGHT
              const height = Math.max(SLOT_HEIGHT, (layout.endSlot - layout.startSlot) * SLOT_HEIGHT)
              const width = 100 / layout.laneCount
              const left = layout.lane * width
              const isActive = !layout.entry.timer.endTime
              const startDate = new Date(layout.entry.timer.startTime)
              const endDate = layout.entry.timer.endTime
                ? new Date(layout.entry.timer.endTime)
                : new Date()

              return (
                <button
                  key={layout.entry.timer.id}
                  type="button"
                  onClick={() => onTaskSelect(layout.entry.task)}
                  className={`absolute rounded-md px-2 py-0.5 text-left text-xs outline outline-1 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-primary/20 outline-primary/40 hover:bg-primary/30'
                      : 'bg-primary/10 outline-primary/25 hover:bg-primary/20'
                  }`}
                  style={{
                    top,
                    height,
                    left: `${left}%`,
                    width: `${width}%`
                  }}
                >
                  <div className="flex items-start justify-between gap-1 overflow-hidden h-full">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground/90 line-clamp-1">
                        {layout.entry.task.title}
                      </div>
                      {height >= SLOT_HEIGHT * 2 && (
                        <div className="text-[10px] text-muted-foreground">
                          {formatTimeRange(startDate, endDate)}
                        </div>
                      )}
                      {height >= SLOT_HEIGHT * 3 && layout.entry.task.tags && layout.entry.task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {layout.entry.task.tags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-[9px] px-1 py-0 leading-tight">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-[10px] font-mono text-muted-foreground">
                      {isActive && showLiveIndicator ? (
                        <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          live
                        </span>
                      ) : (
                        formatDurationShort(layout.entry.durationMs)
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
