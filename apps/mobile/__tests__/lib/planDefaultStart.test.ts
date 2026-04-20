import {
  getSmartPlanRange,
  latestOpenTimedMarkerOnDay,
  defaultTimedRangeForDay,
  PLAN_DEFAULT_DURATION_MIN,
} from '../../lib/planDefaultStart';
import type { Todo } from '@/gen/api/schemas';

const DAY = 86400;

function todo(partial: Partial<Todo> & Pick<Todo, 'id'>): Todo {
  return {
    title: 't',
    starts_at: null,
    ends_at: null,
    is_all_day: 0,
    done: 0,
    done_at: null,
    created_at: 0,
    ...partial,
  };
}

describe('planDefaultStart', () => {
  const dayFrom = 1_700_000_000;
  const dayTo = dayFrom + DAY;

  describe('latestOpenTimedMarkerOnDay', () => {
    it('returns null when no timed open todos', () => {
      expect(latestOpenTimedMarkerOnDay([], dayFrom, dayTo)).toBeNull();
      expect(
        latestOpenTimedMarkerOnDay([todo({ id: 1, starts_at: null })], dayFrom, dayTo)
      ).toBeNull();
    });

    it('uses ends_at when present', () => {
      const todos = [
        todo({ id: 2, starts_at: dayFrom + 3600, ends_at: dayFrom + 7200 }),
        todo({ id: 3, starts_at: dayFrom + 4000, ends_at: dayFrom + 9000 }),
      ];
      expect(latestOpenTimedMarkerOnDay(todos, dayFrom, dayTo)).toBe(dayFrom + 9000);
    });

    it('falls back to starts_at when no ends_at', () => {
      const todos = [todo({ id: 4, starts_at: dayFrom + 5000, ends_at: null })];
      expect(latestOpenTimedMarkerOnDay(todos, dayFrom, dayTo)).toBe(dayFrom + 5000);
    });

    it('ignores all-day and done', () => {
      const todos = [
        todo({ id: 5, starts_at: dayFrom + 100, ends_at: dayFrom + 200, done: 1 }),
        todo({ id: 6, starts_at: dayFrom + 1000, is_all_day: 1 }),
        todo({ id: 7, starts_at: dayFrom + 3000, ends_at: dayFrom + 4000 }),
      ];
      expect(latestOpenTimedMarkerOnDay(todos, dayFrom, dayTo)).toBe(dayFrom + 4000);
    });
  });

  describe('getSmartPlanRange', () => {
    it('uses 9am for non-today', () => {
      const nowMs = (dayFrom + 10 * 3600) * 1000;
      const { start, end } = getSmartPlanRange(false, dayFrom, dayTo, [], nowMs, PLAN_DEFAULT_DURATION_MIN);
      expect(start.getHours()).toBe(9);
      expect(start.getMinutes()).toBe(0);
      expect(end.getTime() - start.getTime()).toBe(PLAN_DEFAULT_DURATION_MIN * 60 * 1000);
    });

    it('uses now when no tasks and viewing today', () => {
      const nowSec = dayFrom + 15 * 3600;
      const { start } = getSmartPlanRange(true, dayFrom, dayTo, [], nowSec * 1000, PLAN_DEFAULT_DURATION_MIN);
      expect(Math.floor(start.getTime() / 1000)).toBe(nowSec);
    });

    it('uses max(now, lastMarker) when last ends before now', () => {
      const nowSec = dayFrom + 16 * 3600;
      const todos = [todo({ id: 8, starts_at: dayFrom + 3600, ends_at: dayFrom + 7200 })];
      const { start } = getSmartPlanRange(true, dayFrom, dayTo, todos, nowSec * 1000, PLAN_DEFAULT_DURATION_MIN);
      expect(Math.floor(start.getTime() / 1000)).toBe(nowSec);
    });

    it('uses lastMarker when now is before last block end', () => {
      const nowSec = dayFrom + 8 * 3600;
      const lastEnd = dayFrom + 14 * 3600;
      const todos = [todo({ id: 9, starts_at: dayFrom + 3600, ends_at: lastEnd })];
      const { start } = getSmartPlanRange(true, dayFrom, dayTo, todos, nowSec * 1000, PLAN_DEFAULT_DURATION_MIN);
      expect(Math.floor(start.getTime() / 1000)).toBe(lastEnd);
    });
  });

  describe('defaultTimedRangeForDay', () => {
    it('anchors at local midnight of from unix then 9am', () => {
      const { start } = defaultTimedRangeForDay(dayFrom, 30);
      const midnight = new Date(dayFrom * 1000);
      expect(start.getFullYear()).toBe(midnight.getFullYear());
      expect(start.getMonth()).toBe(midnight.getMonth());
      expect(start.getDate()).toBe(midnight.getDate());
      expect(start.getHours()).toBe(9);
    });
  });
});
