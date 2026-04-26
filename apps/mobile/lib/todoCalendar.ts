import type { Todo } from '@/gen/api/schemas'

/** Minimal shape for hour-grid layout (ISO times, same as legacy Task calendar fields). */
export type CalendarTimedItem = {
  id: number
  title: string
  startAt: string
  endAt: string | null
  done: number
}

/** Skip all-day and unscheduled todos on the time grid. */
export function todoToCalendarTimedItem(todo: Todo): CalendarTimedItem | null {
  if (todo.is_all_day === 1) return null
  if (todo.starts_at == null) return null
  const startAt = new Date(todo.starts_at * 1000).toISOString()
  const endAt = todo.ends_at != null ? new Date(todo.ends_at * 1000).toISOString() : null
  return { id: todo.id, title: todo.title, startAt, endAt, done: todo.done }
}
