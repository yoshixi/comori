import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'
import { CheckCircle, Info } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'
import type { Task, TaskTimer } from '../../gen/api'
import {
  aggregateDailyTimers,
  aggregateTimersByTag,
  aggregateTaskTimerSummaries,
  formatDurationShort,
  getSessionTimeline,
  getTotalMs,
  getSessionCount
} from '../../lib/timer-aggregation'
import { PeriodSelector, type ReviewPeriod } from '../review/PeriodSelector'
import { StatCard } from '../review/StatCard'
import { SessionTimeline } from '../review/SessionTimeline'

interface ReviewTabProps {
  allTasks: Task[]
  timers: TaskTimer[]
  timersByTaskId: Map<number, TaskTimer[]>
  onToggleCompletion: (task: Task) => void
  onTaskSelect: (task: Task) => void
  period: ReviewPeriod
  onPeriodChange: (period: ReviewPeriod) => void
}

function getDateRange(period: ReviewPeriod): { start: Date; end: Date; days: number } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86400000)

  switch (period) {
    case 'today':
      return { start: today, end: tomorrow, days: 1 }
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 86400000)
      return { start: yesterday, end: today, days: 1 }
    }
    case 'week': {
      // Monday-based week
      const dayOfWeek = now.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(today.getTime() - mondayOffset * 86400000)
      return { start: monday, end: tomorrow, days: Math.ceil((tomorrow.getTime() - monday.getTime()) / 86400000) }
    }
    case '14days': {
      const from = new Date(today.getTime() - 13 * 86400000)
      return { start: from, end: tomorrow, days: 14 }
    }
  }
}

export function ReviewTab({
  allTasks,
  timers,
  timersByTaskId,
  onToggleCompletion,
  onTaskSelect,
  period,
  onPeriodChange
}: ReviewTabProps): React.JSX.Element {

  const { start, end, days } = useMemo(() => getDateRange(period), [period])

  const totalMs = useMemo(() => getTotalMs(timers, start, end), [timers, start, end])
  const sessionCount = useMemo(() => getSessionCount(timers, start, end), [timers, start, end])

  const sessions = useMemo(
    () => getSessionTimeline(timers, allTasks, start, end),
    [timers, allTasks, start, end]
  )

  const dailyData = useMemo(() => aggregateDailyTimers(timers, days), [timers, days])
  const tagData = useMemo(() => aggregateTimersByTag(allTasks, timersByTaskId, days), [allTasks, timersByTaskId, days])
  const taskSummaries = useMemo(() => aggregateTaskTimerSummaries(allTasks, timersByTaskId, days), [allTasks, timersByTaskId, days])

  const showTimeline = period === 'today' || period === 'yesterday'
  const showCharts = period === 'week' || period === '14days'
  const showTagBreakdown = period !== 'today'
  const showTaskTable = period === 'week' || period === '14days'

  const formatDateLabel = (dateStr: string): string => {
    const [, month, day] = dateStr.split('-')
    return `${Number(month)}/${Number(day)}`
  }

  const periodLabel = period === 'today' ? 'today' : period === 'yesterday' ? 'yesterday' : period === 'week' ? 'this week' : 'last 14 days'

  return (
    <div className="space-y-4">
      <PeriodSelector value={period} onChange={onPeriodChange} />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Tracked"
          value={formatDurationShort(totalMs)}
          subtext={`${sessionCount} session${sessionCount !== 1 ? 's' : ''} ${periodLabel}`}
        />
        {days > 1 && (
          <StatCard
            label="Daily Average"
            value={formatDurationShort(days > 0 ? totalMs / days : 0)}
            subtext={`over ${days} days`}
          />
        )}
        {days === 1 && (
          <StatCard
            label="Sessions"
            value={String(sessionCount)}
            subtext={period === 'today' ? 'so far' : 'total'}
          />
        )}
      </div>

      {/* Session Timeline (Today / Yesterday) */}
      {showTimeline && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sessions
          </h3>
          <SessionTimeline
            sessions={sessions}
            onTaskSelect={onTaskSelect}
            showLiveIndicator={period === 'today'}
          />
        </div>
      )}

      {/* Daily Hours Chart (Week / 14 Days) */}
      {showCharts && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            Daily Hours
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Total hours tracked per day from timer sessions</TooltipContent>
            </Tooltip>
          </h3>
          <div className="rounded-lg border bg-card p-4">
            {dailyData.every((d) => d.hours === 0) ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No timer data {periodLabel}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    tickFormatter={(v: number) => `${v}h`}
                  />
                  <RechartsTooltip
                    formatter={(value) => [`${value}h`, 'Hours']}
                    labelFormatter={(label) => formatDateLabel(String(label))}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Tag Breakdown (Yesterday / Week / 14 Days) */}
      {showTagBreakdown && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            Time by Tag
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Timer hours split by tag {periodLabel}</TooltipContent>
            </Tooltip>
          </h3>
          <div className="rounded-lg border bg-card p-4">
            {tagData.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                No tag data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, tagData.length * 36)}>
                <BarChart data={tagData} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}h`}
                  />
                  <YAxis
                    type="category"
                    dataKey="tagName"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <RechartsTooltip formatter={(value) => [`${value}h`, 'Hours']} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Task Summary Table (Week / 14 Days) */}
      {showTaskTable && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            Task Summary
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Total time and session count per task {periodLabel}</TooltipContent>
            </Tooltip>
          </h3>
          {taskSummaries.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No timer sessions recorded yet.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Total Time</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskSummaries.map(({ task, totalMs: taskTotalMs, sessionCount: taskSessions }) => {
                    const isCompleted = !!task.completedAt
                    return (
                    <TableRow
                      key={task.id}
                      className={`cursor-pointer hover:bg-muted/50 ${isCompleted ? 'opacity-50' : ''}`}
                      onClick={() => onTaskSelect(task)}
                    >
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); onToggleCompletion(task) }}
                          className={`h-7 w-7 shrink-0 ${isCompleted ? 'opacity-50' : 'hover:bg-green-200'}`}
                          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                        >
                          <CheckCircle className={`h-4 w-4 ${isCompleted ? 'text-gray-400' : 'text-green-700'}`} />
                        </Button>
                      </TableCell>
                      <TableCell className={`font-medium ${isCompleted ? 'line-through' : ''}`}>{task.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.tags && task.tags.length > 0 ? (
                            task.tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
                                {tag.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatDurationShort(taskTotalMs)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {taskSessions}
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
