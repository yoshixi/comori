import { eq, and, sql, desc } from 'drizzle-orm'
import { postsTable, postEventsTable, postTodosTable, calendarEventsTable, todosTable, type SelectPost } from '../db/schema/schema'
import { type DB } from './common.db'
import type { Post, CreatePost, UpdatePost } from './posts.core'
import { MAX_POSTS_PAGINATED_LIMIT } from './list-limits'

interface LinkedEvent { id: number; title: string }
interface LinkedTodo { id: string; title: string }

async function loadPostRelations(db: DB, postId: string): Promise<{ events: LinkedEvent[]; todos: LinkedTodo[] }> {
  const eventRows = await db
    .select({ id: calendarEventsTable.id, title: calendarEventsTable.title })
    .from(postEventsTable)
    .innerJoin(calendarEventsTable, eq(postEventsTable.eventId, calendarEventsTable.id))
    .where(eq(postEventsTable.postId, postId))

  const todoRows = await db
    .select({ id: todosTable.id, title: todosTable.title })
    .from(postTodosTable)
    .innerJoin(todosTable, eq(postTodosTable.todoId, todosTable.id))
    .where(eq(postTodosTable.postId, postId))

  return { events: eventRows, todos: todoRows }
}

async function convertDbPostToApi(db: DB, row: SelectPost): Promise<Post> {
  const { events, todos } = await loadPostRelations(db, row.id)
  return {
    id: row.id,
    body: row.body,
    posted_at: row.postedAt,
    events,
    todos,
  }
}

export async function getPostsByRange(
  db: DB,
  userId: number,
  from: number,
  to: number,
  limitRows: number
): Promise<Post[]> {
  const rows = await db
    .select()
    .from(postsTable)
    .where(and(
      eq(postsTable.userId, userId),
      sql`${postsTable.postedAt} >= ${from}`,
      sql`${postsTable.postedAt} < ${to}`,
    ))
    .orderBy(postsTable.postedAt)
    .limit(limitRows)

  return Promise.all(rows.map(row => convertDbPostToApi(db, row)))
}

/** All posts for the user, newest first, with offset pagination. */
export async function getPostsPaginated(
  db: DB,
  userId: number,
  opts: { limit: number; offset: number }
): Promise<{ posts: Post[]; has_more: boolean }> {
  const cap = Math.min(opts.limit, MAX_POSTS_PAGINATED_LIMIT)
  const take = cap + 1

  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.userId, userId))
    .orderBy(desc(postsTable.postedAt), desc(postsTable.id))
    .limit(take)
    .offset(opts.offset)

  const hasMore = rows.length > cap
  const slice = hasMore ? rows.slice(0, cap) : rows
  const posts = await Promise.all(slice.map((row) => convertDbPostToApi(db, row)))
  return { posts, has_more: hasMore }
}

export async function getPostById(db: DB, userId: number, postId: string): Promise<Post | null> {
  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.id, postId), eq(postsTable.userId, userId)))

  return row ? convertDbPostToApi(db, row) : null
}

export async function createPost(db: DB, userId: number, data: CreatePost): Promise<Post> {
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  const [row] = await db.insert(postsTable).values({
    id,
    userId,
    body: data.body.trim(),
    postedAt: data.posted_at ?? now,
  }).returning()

  if (!row) throw new Error('Failed to create post')

  // Insert junction records
  if (data.event_ids && data.event_ids.length > 0) {
    await db.insert(postEventsTable).values(
      data.event_ids.map(eventId => ({ postId: id, eventId }))
    )
  }
  if (data.todo_ids && data.todo_ids.length > 0) {
    await db.insert(postTodosTable).values(
      data.todo_ids.map(todoId => ({ postId: id, todoId }))
    )
  }

  return convertDbPostToApi(db, row)
}

export async function updatePost(db: DB, userId: number, postId: string, data: UpdatePost): Promise<Post | null> {
  const [existing] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.id, postId), eq(postsTable.userId, userId)))

  if (!existing) return null

  if (data.body !== undefined) {
    await db
      .update(postsTable)
      .set({ body: data.body.trim() })
      .where(eq(postsTable.id, postId))
  }

  // Replace junction records if provided
  if (data.event_ids !== undefined) {
    await db.delete(postEventsTable).where(eq(postEventsTable.postId, postId))
    if (data.event_ids.length > 0) {
      await db.insert(postEventsTable).values(
        data.event_ids.map(eventId => ({ postId, eventId }))
      )
    }
  }
  if (data.todo_ids !== undefined) {
    await db.delete(postTodosTable).where(eq(postTodosTable.postId, postId))
    if (data.todo_ids.length > 0) {
      await db.insert(postTodosTable).values(
        data.todo_ids.map(todoId => ({ postId, todoId }))
      )
    }
  }

  return getPostById(db, userId, postId)
}

export async function deletePost(db: DB, userId: number, postId: string): Promise<Post | null> {
  const post = await getPostById(db, userId, postId)
  if (!post) return null

  // Junction tables cascade-delete via FK
  await db.delete(postsTable).where(and(eq(postsTable.id, postId), eq(postsTable.userId, userId)))
  return post
}
