import type { Todo } from '@/gen/api/schemas';

export const PLAN_DEFAULT_DURATION_MIN = 30;

/** Fixed morning default when viewing a day other than today. */
export function defaultTimedRangeForDay(dayFromUnix: number, durationMin: number): { start: Date; end: Date } {
  const start = new Date(dayFromUnix * 1000);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMin);
  return { start, end };
}

/**
 * Latest instant among open, timed to-dos scheduled on this local day (for stacking new items).
 * Uses `ends_at ?? starts_at` per task. Skips all-day and unscheduled.
 */
export function latestOpenTimedMarkerOnDay(
  todos: Todo[],
  dayFromUnix: number,
  dayToUnix: number
): number | null {
  let max: number | null = null;
  for (const t of todos) {
    if (t.done !== 0) continue;
    if (t.is_all_day === 1) continue;
    if (t.starts_at == null) continue;
    if (t.starts_at < dayFromUnix || t.starts_at >= dayToUnix) continue;
    const marker = t.ends_at ?? t.starts_at;
    if (max == null || marker > max) max = marker;
  }
  return max;
}

/**
 * Default start/end for the Plan composer.
 *
 * When **not** viewing today: 9:00 on that day + duration.
 * When **viewing today**: `start = max(now, latestMarker)` where `latestMarker` is the greatest
 * `ends_at ?? starts_at` among open timed tasks on this day; if none, use `now`.
 */
export function getSmartPlanRange(
  viewingToday: boolean,
  dayFromUnix: number,
  dayToUnix: number,
  todos: Todo[],
  nowMs: number,
  durationMin: number
): { start: Date; end: Date } {
  if (!viewingToday) {
    return defaultTimedRangeForDay(dayFromUnix, durationMin);
  }

  const nowSec = Math.floor(nowMs / 1000);
  const lastLatest = latestOpenTimedMarkerOnDay(todos, dayFromUnix, dayToUnix);
  const startUnix = lastLatest == null ? nowSec : Math.max(nowSec, lastLatest);
  const start = new Date(startUnix * 1000);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMin);
  return { start, end };
}
