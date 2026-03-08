import React from 'react'
import { CheckCircle, ArrowRight, X, CalendarOff } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { Task } from '../../gen/api'

interface PlanningPanelProps {
  carryoverTasks: Task[]
  onMoveToToday: (taskId: number) => void
  onSkip: (taskId: number) => void
  onComplete: (task: Task) => void
  onMoveAllToToday: () => void
  onClose: () => void
}

function formatOriginalDate(startAt: string | null | undefined): string {
  if (!startAt) return ''
  const date = new Date(startAt)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PlanningPanel({
  carryoverTasks,
  onMoveToToday,
  onSkip,
  onComplete,
  onMoveAllToToday,
  onClose
}: PlanningPanelProps): React.JSX.Element {
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
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <p>All caught up! No tasks from previous days.</p>
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
        </div>
      </div>
    </div>
  )
}
