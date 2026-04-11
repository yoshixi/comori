import { useCallback, useMemo } from 'react'
import {
  useGetApiV1Posts,
  postApiV1Posts,
  deleteApiV1PostsId
} from '../gen/api/endpoints/techooAPI.gen'
import type { ErrorResponse, Post } from '../gen/api/schemas'

function todayBoundaries(): { from: number; to: number } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return {
    from: Math.floor(startOfDay.getTime() / 1000),
    to: Math.floor(endOfDay.getTime() / 1000)
  }
}

export function usePosts(options?: { from: number; to: number }): {
  posts: Post[]
  isLoading: boolean
  error: ErrorResponse | undefined
  createPost: (body: string, eventIds: number[], todoIds: string[]) => Promise<void>
  deletePost: (id: string) => Promise<void>
} {
  const params = useMemo(() => options ?? todayBoundaries(), [options])

  const { data, error, isLoading, mutate } = useGetApiV1Posts(params)

  const posts: Post[] = data?.data ?? []

  const createPost = useCallback(
    async (body: string, eventIds: number[], todoIds: string[]) => {
      const now = Math.floor(Date.now() / 1000)
      const optimistic: Post = {
        id: `temp-${now}`,
        body,
        posted_at: now,
        events: [],
        todos: []
      }

      mutate(
        (current) => ({
          data: [optimistic, ...(current?.data ?? [])]
        }),
        { revalidate: false }
      )

      try {
        await postApiV1Posts({
          body,
          event_ids: eventIds,
          todo_ids: todoIds
        })
        await mutate()
      } catch {
        await mutate()
      }
    },
    [mutate]
  )

  const deletePost = useCallback(
    async (id: string) => {
      await deleteApiV1PostsId(id)
      await mutate()
    },
    [mutate]
  )

  return { posts, isLoading, error, createPost, deletePost }
}
