import React, { useCallback, useState } from 'react'
import { CheckCircle, ArrowRight, X, CalendarOff, Plus, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import type { Task } from '../../gen/api'
import { formatTimeRangeShort } from '../../lib/time'

interface PlanningPanelProps {
  carryoverTasks: Task[]
  todayTasks: Task[]
  onMoveToToday: (taskId: number) => void
  onSkip: (taskId: number) => void
  onComplete: (task: Task) => void
  onMoveAllToToday: () => void
  onCreateTodayTask: (title: string) => void
  onClose: () => void
}

function formatOriginalDate(startAt: string | null | undefined): string {
  if (!startAt) return ''
  const date = new Date(startAt)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function computeTimeSummary(tasks: Task[]): { scheduled: number; count: number } {
  let scheduled = 0
  for (const task of tasks) {
    if (task.startAt && task.endAt) {
      scheduled += new Date(task.endAt).getTime() - new Date(task.startAt).getTime()
    }
  }
  return { scheduled: Math.round(scheduled / 60000), count: tasks.length }
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function PlanningPanel({
  carryoverTasks,
  todayTasks,
  onMoveToToday,
  onSkip,
  onComplete,
  onMoveAllToToday,
  onCreateTodayTask,
  onClose
}: PlanningPanelProps): React.JSX.Element {
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleAddTask = useCallback(() => {
    if (!newTaskTitle.trim()) return
    onCreateTodayTask(newTaskTitle.trim())
    setNewTaskTitle('')
  }, [newTaskTitle, onCreateTodayTask])

  const summary = computeTimeSummary(todayTasks)

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[80vh] rounded-lg border bg-background shadow-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10 rounded-t-lg">
          <h2 className="text-lg font-semibold">Plan Your Day</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Carryover Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Carry Over {carryoverTasks.length > 0 && `(${carryoverTasks.length})`}
              </h3>
              {carryoverTasks.length > 1 && (
                <Button size="sm" variant="outline" onClick={onMoveAllToToday} className="text-xs">
                  Move All to Today
                </Button>
              )}
            </div>

            {carryoverTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                All caught up! No tasks from previous days.
              </div>
            ) : (
              <div className="space-y-2">
                {carryoverTasks.map((task) => {
                  const isCompleted = !!task.completedAt
                  return (
                    <div
                      key={task.id}
                      className={`rounded-lg border p-3 space-y-2 ${isCompleted ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isCompleted ? 'line-through' : ''}`}>
                            {task.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            from {formatOriginalDate(task.startAt)}
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {!isCompleted && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onMoveToToday(task.id)}
                            className="text-xs"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Today
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSkip(task.id)}
                            className="text-xs"
                          >
                            <CalendarOff className="h-3 w-3 mr-1" />
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onComplete(task)}
                            className="text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Done
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add Tasks Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Add Tasks</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="What do you need to do today?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask() }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Today's Plan Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Today's Plan {todayTasks.length > 0 && `(${todayTasks.length})`}
            </h3>

            {todayTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No tasks planned for today yet.
              </div>
            ) : (
              <div className="space-y-1">
                {todayTasks.map((task) => {
                  const isCompleted = !!task.completedAt
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 rounded-lg border p-2 ${isCompleted ? 'opacity-50' : ''}`}
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="text-xs text-muted-foreground w-28 shrink-0">
                        {formatTimeRangeShort(task.startAt, task.endAt)}
                      </div>
                      <div className={`flex-1 text-sm font-medium truncate ${isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </div>
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                          {task.tags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Summary */}
            {todayTasks.length > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                {summary.count} tasks planned{summary.scheduled > 0 && ` · ${formatMinutes(summary.scheduled)} scheduled`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
