import { pickRunningTodo, pickNextTimedTodo, DEFAULT_TODO_DURATION_SEC } from '../../lib/runningTodo';
import type { Todo } from '@/gen/api/schemas';

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

describe('runningTodo', () => {
  describe('pickRunningTodo', () => {
    it('returns null when empty', () => {
      expect(pickRunningTodo([], 100)).toBeNull();
    });

    it('picks timed todo in window', () => {
      const a = todo({ id: 'a', starts_at: 100, ends_at: 200 });
      expect(pickRunningTodo([a], 150)).toEqual(a);
    });

    it('uses default duration when ends_at missing', () => {
      const a = todo({ id: 'a', starts_at: 100, ends_at: null });
      expect(pickRunningTodo([a], 100)).toEqual(a);
      expect(pickRunningTodo([a], 100 + DEFAULT_TODO_DURATION_SEC - 1)).toEqual(a);
      expect(pickRunningTodo([a], 100 + DEFAULT_TODO_DURATION_SEC)).toBeNull();
    });

    it('picks earliest start when two overlap', () => {
      const early = todo({ id: 'e', starts_at: 100, ends_at: 300 });
      const late = todo({ id: 'l', starts_at: 150, ends_at: 400 });
      expect(pickRunningTodo([late, early], 200)).toEqual(early);
    });

    it('falls back to first all-day when no timed match', () => {
      const ad = todo({ id: 'd', is_all_day: 1, starts_at: null });
      expect(pickRunningTodo([ad], 999)).toEqual(ad);
    });

    it('ignores done', () => {
      const a = todo({ id: 'a', starts_at: 100, ends_at: 200, done: 1 });
      expect(pickRunningTodo([a], 150)).toBeNull();
    });
  });

  describe('pickNextTimedTodo', () => {
    it('returns earliest future timed', () => {
      const t1 = todo({ id: '1', starts_at: 200 });
      const t2 = todo({ id: '2', starts_at: 150 });
      expect(pickNextTimedTodo([t1, t2], 100)).toEqual(t2);
    });

    it('returns null when none in future', () => {
      const t = todo({ id: '1', starts_at: 100 });
      expect(pickNextTimedTodo([t], 200)).toBeNull();
    });
  });
});
