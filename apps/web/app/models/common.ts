import { z } from '@hono/zod-openapi'
import { UUIDSchemaFinal } from './schemas'

// Common error response model
export const ErrorResponseModel = z.object({
  error: z.string().openapi({
    description: 'Error message describing what went wrong',
    example: 'Task not found'
  }),
  code: z.string().optional().openapi({
    description: 'Optional error code',
    example: 'TASK_NOT_FOUND'
  })
}).openapi('ErrorResponse')

// Health check response model
export const HealthResponseModel = z.object({
  status: z.string().openapi({
    description: 'Health status',
    example: 'ok'
  }),
  message: z.string().openapi({
    description: 'Health status message',
    example: 'Shuchu API is running'
  }),
  timestamp: z.string().datetime().openapi({
    description: 'Current timestamp',
    example: '2024-01-01T10:00:00.000Z'
  })
}).openapi('HealthResponse')

// Path parameter models
export const TaskIdParamModel = z.object({
  id: UUIDSchemaFinal.openapi({
    description: 'Task ID',
    param: {
      name: 'id',
      in: 'path'
    }
  })
}).openapi('TaskIdParam')

export const TimerIdParamModel = z.object({
  id: UUIDSchemaFinal.openapi({
    description: 'Timer ID',
    param: {
      name: 'id',
      in: 'path'
    }
  })
}).openapi('TimerIdParam')

export const TaskIdForTimersParamModel = z.object({
  taskId: UUIDSchemaFinal.openapi({
    description: 'Task ID for timer operations',
    param: {
      name: 'taskId',
      in: 'path'
    }
  })
}).openapi('TaskIdForTimersParam')

// Export types
export type ErrorResponse = z.infer<typeof ErrorResponseModel>
export type HealthResponse = z.infer<typeof HealthResponseModel>
export type TaskIdParam = z.infer<typeof TaskIdParamModel>
export type TimerIdParam = z.infer<typeof TimerIdParamModel>
export type TaskIdForTimersParam = z.infer<typeof TaskIdForTimersParamModel>