import { useCallback, useMemo } from 'react'
import type { Key } from 'swr'
import {
  useGetApiV1Todos,
  postApiV1Todos,
  patchApiV1TodosId,
  deleteApiV1TodosId,
} from '@/gen/api/endpoints/techooAPI.gen'
import type { ErrorResponse, GetApiV1TodosParams, Todo } from '@/gen/api/schemas'

export function useTodos(options?: {
  from?: number
  to?: number
  showAll?: boolean
  includeCompletedInRange?: boolean
  fetchAll?: boolean
}): {
  todos: Todo[]
  isLoading: boolean
  error: ErrorResponse | undefined
  createTodo: (title: string, startsAt?: number, endsAt?: number, isAllDay?: number) => Promise<void>
  updateTodo: (
    id: string,
    updates: {
      title?: string
      starts_at?: number | null
      ends_at?: number | null
      is_all_day?: number
      done?: number
    }
  ) => Promise<void>
  toggleDone: (id: string, currentDone: number) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  mutate: ReturnType<typeof useGetApiV1Todos>['mutate']
} {
  const params: GetApiV1TodosParams | undefined = useMemo(() => {
    if (options?.fetchAll) return {}
    if (options?.showAll) return { done: 'false' as const }
    if (options?.from != null && options?.to != null) {
      const includeCompleted = options.includeCompletedInRange !== false
      if (includeCompleted) return { from: options.from, to: options.to }
      return { from: options.from, to: options.to, done: 'false' as const }
    }
    return { done: 'false' as const }
  }, [options?.from, options?.to, options?.showAll, options?.fetchAll, options?.includeCompletedInRange])

  /** Primitive tuple so SWR cache always tracks range/filters (avoids stale lists when the day changes). */
  const swrKey = useMemo<Key>(
    () => ['/api/v1/todos', params?.from ?? null, params?.to ?? null, params?.done ?? null],
    [params?.from, params?.to, params?.done]
  )

  const { data, isLoading, error, mutate } = useGetApiV1Todos(params, {
    swr: { swrKey },
  })
  const todos = data?.data ?? []

  /** Lists that only fetch open items — completed rows must leave the cache without a global refetch. */
  const listOpenOnly = params?.done === 'false'

  const createTodo = useCallback(
    async (title: string, startsAt?: number, endsAt?: number, isAllDay?: number) => {
      const now = Math.floor(Date.now() / 1000)
      const allDay = isAllDay ?? 0
      const tempId = `temp-${Date.now()}`
      const optimisticTodo: Todo = {
        id: tempId,
        title,
        starts_at: startsAt ?? null,
        ends_at: endsAt ?? null,
        is_all_day: allDay,
        done: 0,
        done_at: null,
        created_at: now,
      }
      mutate(
        (current) => {
          if (!current) return { data: [optimisticTodo] }
          return { data: [...current.data, optimisticTodo] }
        },
        { revalidate: false }
      )
      try {
        const res = await postApiV1Todos({
          title,
          starts_at: startsAt,
          ends_at: endsAt,
          is_all_day: allDay,
        })
        mutate(
          (current) => {
            if (!current) return { data: [res.data] }
            return { data: current.data.map((t) => (t.id === tempId ? res.data : t)) }
          },
          { revalidate: false }
        )
      } catch {
        await mutate()
      }
    },
    [mutate]
  )

  const toggleDone = useCallback(
    async (id: string, currentDone: number) => {
      const newDone = currentDone === 1 ? 0 : 1
      const now = Math.floor(Date.now() / 1000)
      mutate(
        (current) => {
          if (!current) return current
          if (newDone === 1 && listOpenOnly) {
            return { data: current.data.filter((t) => t.id !== id) }
          }
          return {
            data: current.data.map((t) =>
              t.id === id ? { ...t, done: newDone, done_at: newDone === 1 ? now : null } : t
            ),
          }
        },
        { revalidate: false }
      )
      try {
        const res = await patchApiV1TodosId(id, { done: newDone })
        if (newDone === 1 && listOpenOnly) {
          // Already dropped from cache; nothing to merge.
        } else {
          mutate(
            (current) => {
              if (!current) return current
              return { data: current.data.map((t) => (t.id === id ? res.data : t)) }
            },
            { revalidate: false }
          )
        }
      } catch {
        await mutate()
      }
    },
    [mutate, listOpenOnly]
  )

  const updateTodo = useCallback(
    async (
      id: string,
      updates: {
        title?: string
        starts_at?: number | null
        ends_at?: number | null
        is_all_day?: number
        done?: number
      }
    ) => {
      const completing = listOpenOnly && updates.done === 1
      mutate(
        (current) => {
          if (!current) return current
          if (completing) {
            return { data: current.data.filter((t) => t.id !== id) }
          }
          return { data: current.data.map((t) => (t.id === id ? ({ ...t, ...updates } as Todo) : t)) }
        },
        { revalidate: false }
      )
      try {
        const res = await patchApiV1TodosId(id, updates)
        mutate(
          (current) => {
            if (!current) return current
            if (listOpenOnly && res.data.done === 1) {
              return { data: current.data.filter((t) => t.id !== id) }
            }
            return { data: current.data.map((t) => (t.id === id ? res.data : t)) }
          },
          { revalidate: false }
        )
      } catch {
        await mutate()
      }
    },
    [mutate, listOpenOnly]
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      mutate(
        (current) => {
          if (!current) return current
          return { data: current.data.filter((t) => t.id !== id) }
        },
        { revalidate: false }
      )
      try {
        await deleteApiV1TodosId(id)
      } catch {
        await mutate()
      }
    },
    [mutate]
  )

  return { todos, isLoading, error, createTodo, updateTodo, toggleDone, deleteTodo, mutate }
}
