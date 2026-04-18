/**
 * Central defaults and caps for list / collection queries to avoid unbounded reads.
 */

/** Default row cap when a client does not pass `limit` (todos, notes, events, etc.). */
export const DEFAULT_LIST_LIMIT = 100

/** Maximum `limit` for generic list endpoints. */
export const MAX_LIST_LIMIT = 500

/** Paginated “all posts” feed (newest first, no from/to). */
export const DEFAULT_POSTS_PAGINATED_LIMIT = 30
export const MAX_POSTS_PAGINATED_LIMIT = 100

/** Time-range post queries (from/to). High ceiling for day views and todo-thread ranges. */
export const DEFAULT_POSTS_RANGE_LIMIT = 1000
export const MAX_POSTS_RANGE_LIMIT = 10000

export function clampGenericListLimit(limit?: number): number {
  const v = limit ?? DEFAULT_LIST_LIMIT
  return Math.min(Math.max(1, Math.floor(v)), MAX_LIST_LIMIT)
}

export function clampPostsPaginatedLimit(limit?: number): number {
  const v = limit ?? DEFAULT_POSTS_PAGINATED_LIMIT
  return Math.min(Math.max(1, Math.floor(v)), MAX_POSTS_PAGINATED_LIMIT)
}

export function clampPostsRangeLimit(limit?: number): number {
  const v = limit ?? DEFAULT_POSTS_RANGE_LIMIT
  return Math.min(Math.max(1, Math.floor(v)), MAX_POSTS_RANGE_LIMIT)
}
