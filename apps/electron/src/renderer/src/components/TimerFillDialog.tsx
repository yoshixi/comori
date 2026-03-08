import React, { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { formatDateTimeInput } from '../lib/time'
import type { Task } from '../gen/api'

interface TimerFillDialogProps {
  task: Task | null
  onConfirm: (taskId: number, startTime: string, endTime: string) => void
  onSkip: (task: Task) => void
  onCancel: () => void
}

export function TimerFillDialog({ task, onConfirm, onSkip, onCancel }: TimerFillDialogProps): React.JSX.Element {
  const defaults = useMemo(() => {
    if (!task) return { start: '', end: '' }
    const start = task.startAt ? formatDateTimeInput(task.startAt) : formatDateTimeInput(new Date().toISOString())
    const end = task.endAt ? formatDateTimeInput(task.endAt) : formatDateTimeInput(new Date().toISOString())
    return { start, end }
  }, [task])

  const [startTime, setStartTime] = useState(defaults.start)
  const [endTime, setEndTime] = useState(defaults.end)

  // Reset when task changes
  React.useEffect(() => {
    setStartTime(defaults.start)
    setEndTime(defaults.end)
  }, [defaults])

  if (!task) return <Dialog open={false}><DialogContent><DialogHeader><DialogTitle /></DialogHeader></DialogContent></Dialog>

  const handleConfirm = (): void => {
    const start = new Date(startTime).toISOString()
    const end = new Date(endTime).toISOString()
    onConfirm(task.id, start, end)
  }

  return (
    <Dialog open={!!task} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Time</DialogTitle>
          <DialogDescription>
            This task has no timer records. Would you like to log time spent?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="text-sm font-medium truncate">{task.title}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={() => onSkip(task)}>
            Skip
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Record & Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
