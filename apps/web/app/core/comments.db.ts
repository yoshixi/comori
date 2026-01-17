import { and, desc, eq, inArray } from 'drizzle-orm'
import { taskCommentsTable, tasksTable, type InsertTaskComment, type SelectTaskComment } from '../db/schema/schema'
import { createId, type DB } from './common.db'
import { formatTimestamp, getCurrentUnixTimestamp, validateRequiredString } from './common.core'

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface CreateComment {
  taskId: string
  body: string
}

export interface UpdateComment {
  body?: string
}

function convertDbCommentToApi(dbComment: SelectTaskComment): TaskComment {
  return {
    id: dbComment.id.toString(),
    taskId: dbComment.taskId.toString(),
    authorId: dbComment.authorId.toString(),
    body: dbComment.body,
    createdAt: formatTimestamp(dbComment.createdAt),
    updatedAt: formatTimestamp(dbComment.updatedAt)
  }
}

function normalizeBody(body: string | undefined): string {
  const trimmed = validateRequiredString(body, 'Comment body')
  if (trimmed.length > 2000) {
    throw new Error('Comment body must be 2000 characters or fewer')
  }
  return trimmed
}

export async function getCommentsByTaskId(db: DB, userId: string, taskId: string): Promise<TaskComment[] | null> {
  const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)))

  if (!task) {
    return null
  }

  const dbComments = await db
    .select()
    .from(taskCommentsTable)
    .where(eq(taskCommentsTable.taskId, taskId))
    .orderBy(desc(taskCommentsTable.createdAt), desc(taskCommentsTable.id))

  return dbComments.map(convertDbCommentToApi)
}

export async function getCommentsByTaskIds(db: DB, taskIds: string[]): Promise<TaskComment[]> {
  if (taskIds.length === 0) {
    return []
  }

  const uniqueIds = Array.from(new Set(taskIds))
  const dbComments = await db
    .select()
    .from(taskCommentsTable)
    .where(inArray(taskCommentsTable.taskId, uniqueIds))
    .orderBy(desc(taskCommentsTable.createdAt), desc(taskCommentsTable.id))

  return dbComments.map(convertDbCommentToApi)
}

export async function getCommentById(
  db: DB,
  userId: string,
  taskId: string,
  commentId: string
): Promise<TaskComment | null> {
  const [dbComment] = await db
    .select({
      comment: taskCommentsTable,
      task: tasksTable
    })
    .from(taskCommentsTable)
    .innerJoin(tasksTable, eq(taskCommentsTable.taskId, tasksTable.id))
    .where(
      and(
        eq(taskCommentsTable.id, commentId),
        eq(taskCommentsTable.taskId, taskId),
        eq(tasksTable.userId, userId)
      )
    )

  if (!dbComment) {
    return null
  }

  return convertDbCommentToApi(dbComment.comment)
}

export async function createComment(db: DB, userId: string, data: CreateComment): Promise<TaskComment | null> {
  const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, data.taskId), eq(tasksTable.userId, userId)))

  if (!task) {
    return null
  }

  const now = getCurrentUnixTimestamp()
  const commentData: InsertTaskComment = {
    id: createId(),
    taskId: data.taskId,
    authorId: userId,
    body: normalizeBody(data.body),
    createdAt: now,
    updatedAt: now
  }

  const result = await db.insert(taskCommentsTable).values(commentData).returning()
  const inserted = result[0]
  if (!inserted) {
    throw new Error('Failed to create comment')
  }

  return convertDbCommentToApi(inserted)
}

export async function updateComment(
  db: DB,
  userId: string,
  taskId: string,
  commentId: string,
  data: UpdateComment
): Promise<TaskComment | null> {
  const [existing] = await db
    .select({
      comment: taskCommentsTable,
      task: tasksTable
    })
    .from(taskCommentsTable)
    .innerJoin(tasksTable, eq(taskCommentsTable.taskId, tasksTable.id))
    .where(
      and(
        eq(taskCommentsTable.id, commentId),
        eq(taskCommentsTable.taskId, taskId),
        eq(tasksTable.userId, userId)
      )
    )

  if (!existing) {
    return null
  }

  const now = getCurrentUnixTimestamp()
  const updateData: Partial<InsertTaskComment> = {
    updatedAt: now
  }

  if (data.body !== undefined) {
    updateData.body = normalizeBody(data.body)
  }

  const [updated] = await db
    .update(taskCommentsTable)
    .set(updateData)
    .where(eq(taskCommentsTable.id, commentId))
    .returning()

  if (!updated) {
    return null
  }

  return convertDbCommentToApi(updated)
}

export async function deleteComment(
  db: DB,
  userId: string,
  taskId: string,
  commentId: string
): Promise<TaskComment | null> {
  const [existing] = await db
    .select({
      comment: taskCommentsTable,
      task: tasksTable
    })
    .from(taskCommentsTable)
    .innerJoin(tasksTable, eq(taskCommentsTable.taskId, tasksTable.id))
    .where(
      and(
        eq(taskCommentsTable.id, commentId),
        eq(taskCommentsTable.taskId, taskId),
        eq(tasksTable.userId, userId)
      )
    )

  if (!existing) {
    return null
  }

  const [deleted] = await db
    .delete(taskCommentsTable)
    .where(eq(taskCommentsTable.id, commentId))
    .returning()

  if (!deleted) {
    return null
  }

  return convertDbCommentToApi(deleted)
}
