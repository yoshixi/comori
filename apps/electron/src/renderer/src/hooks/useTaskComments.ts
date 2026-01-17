import useSWR, { type SWRResponse } from 'swr'
import { customInstance } from '../lib/api/mutator'

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface TaskCommentListResponse {
  comments: TaskComment[]
  total: number
}

export interface TaskCommentResponse {
  comment: TaskComment
}

const commentsKey = (taskId: string) => ['/api/tasks', taskId, 'comments'] as const

const fetchTaskComments = (taskId: string) => {
  return customInstance<TaskCommentListResponse>({
    url: `/api/tasks/${taskId}/comments`,
    method: 'GET'
  })
}

export const createTaskComment = (taskId: string, body: string) => {
  return customInstance<TaskCommentResponse>({
    url: `/api/tasks/${taskId}/comments`,
    method: 'POST',
    data: { body }
  })
}

export type UseTaskCommentsResult = SWRResponse<TaskCommentListResponse, unknown>

export const useTaskComments = (taskId?: string): UseTaskCommentsResult => {
  return useSWR(taskId ? commentsKey(taskId) : null, () => fetchTaskComments(taskId!))
}
