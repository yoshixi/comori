import {
  useGetApiV1Todos,
  postApiV1Todos,
  patchApiV1TodosId,
  deleteApiV1TodosId
} from '../gen/api/endpoints/techooAPI.gen'
import type { ErrorResponse, GetApiV1TodosParams, Todo } from '../gen/api/schemas'
import { useCallback, useMemo } from 'react'

export function useTodos(options?: {
  from?: number
  to?: number
  showAll?: boolean
  /**
   * When fetching a day/range (`from`+`to`), include completed todos.
   * Default true (Today tab calendar needs them). ToDo list passes false to hide completed unless toggled.
   */
  includeCompletedInRange?: boolean
  /** All todos for the tenant (no date or done filter). Use sparingly. */
  fetchAll?: boolean
}): {
  todos: Todo[]
  isLoading: boolean
  error: ErrorResponse | undefined
  createTodo: (title: string, startsAt?: number, endsAt?: number) => Promise<void>
  updateTodo: (
    id: string,
    updates: {
      title?: string
      description?: string | null
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
    if (options?.fetchAll) {
      return {}
    }
    if (options?.showAll) {
      return { done: 'false' as const }
    }
    if (options?.from != null && options?.to != null) {
      const includeCompleted = options.includeCompletedInRange !== false
      if (includeCompleted) {
        return { from: options.from, to: options.to }
      }
      return { from: options.from, to: options.to, done: 'false' as const }
    }
    return { done: 'false' as const }
  }, [options?.from, options?.to, options?.showAll, options?.fetchAll, options?.includeCompletedInRange])

  const { data, isLoading, error, mutate } = useGetApiV1Todos(params)

  const todos = data?.data ?? []

  const mergeTodoFromServer = useCallback(
    (id: string, server: Todo) => {
      mutate(
        (current) => {
          if (!current) return current
          return {
            data: current.data.map((t) => (t.id === id ? server : t))
          }
        },
        { revalidate: false }
      )
    },
    [mutate]
  )

  const stripTempTodos = useCallback(
    (current: { data: Todo[] } | undefined, server: Todo) => {
      if (!current) return { data: [server] }
      const noTemp = current.data.filter((t) => !String(t.id).startsWith('temp-'))
      return { data: [...noTemp, server] }
    },
    []
  )

  const createTodo = useCallback(
    async (title: string, startsAt?: number, endsAt?: number) => {
      const now = Math.floor(Date.now() / 1000)
      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        title,
        description: null,
        starts_at: startsAt ?? null,
        ends_at: endsAt ?? null,
        is_all_day: 0,
        done: 0,
        done_at: null,
        created_at: now
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
          ends_at: endsAt
        })
        mutate((current) => stripTempTodos(current, res.data), { revalidate: false })
      } catch {
        await mutate()
      }
    },
    [mutate, stripTempTodos]
  )

  const toggleDone = useCallback(
    async (id: string, currentDone: number) => {
      const newDone = currentDone === 1 ? 0 : 1
      const now = Math.floor(Date.now() / 1000)

      mutate(
        (current) => {
          if (!current) return current
          return {
            data: current.data.map((t) =>
              t.id === id ? { ...t, done: newDone, done_at: newDone === 1 ? now : null } : t
            )
          }
        },
        { revalidate: false }
      )

      try {
        const res = await patchApiV1TodosId(id, { done: newDone })
        mergeTodoFromServer(id, res.data)
      } catch {
        await mutate()
      }
    },
    [mutate, mergeTodoFromServer]
  )

  const updateTodo = useCallback(
    async (
      id: string,
      updates: {
        title?: string
        description?: string | null
        starts_at?: number | null
        ends_at?: number | null
        is_all_day?: number
        done?: number
      }
    ) => {
      mutate(
        (current) => {
          if (!current) return current
          return {
            data: current.data.map((t) => (t.id === id ? ({ ...t, ...updates } as Todo) : t))
          }
        },
        { revalidate: false }
      )

      try {
        const res = await patchApiV1TodosId(id, updates)
        mergeTodoFromServer(id, res.data)
      } catch {
        await mutate()
      }
    },
    [mutate, mergeTodoFromServer]
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
