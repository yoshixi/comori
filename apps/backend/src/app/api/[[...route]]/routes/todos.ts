import { createRoute } from '@hono/zod-openapi'
import {
  TodoListResponseModel,
  TodoResponseModel,
  TodoQueryParamsModel,
  TodoIdParamModel,
  CreateTodoModel,
  UpdateTodoModel,
} from '../../../core/todos.core'
import { ErrorResponseModel } from '../../../core/common.core'

export const listTodosRoute = createRoute({
  method: 'get',
  path: '/v1/todos',
  summary: 'List todos',
  description: 'Retrieve todos with optional date range and completion filters',
  request: { query: TodoQueryParamsModel },
  responses: {
    200: { content: { 'application/json': { schema: TodoListResponseModel } }, description: 'Todos retrieved' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})

export const createTodoRoute = createRoute({
  method: 'post',
  path: '/v1/todos',
  summary: 'Create a todo',
  request: { body: { content: { 'application/json': { schema: CreateTodoModel } } } },
  responses: {
    201: { content: { 'application/json': { schema: TodoResponseModel } }, description: 'Todo created' },
    400: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Bad request' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})

export const updateTodoRoute = createRoute({
  method: 'patch',
  path: '/v1/todos/{id}',
  summary: 'Update a todo',
  request: {
    params: TodoIdParamModel,
    body: { content: { 'application/json': { schema: UpdateTodoModel } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: TodoResponseModel } }, description: 'Todo updated' },
    404: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})

export const deleteTodoRoute = createRoute({
  method: 'delete',
  path: '/v1/todos/{id}',
  summary: 'Delete a todo',
  request: { params: TodoIdParamModel },
  responses: {
    200: { content: { 'application/json': { schema: TodoResponseModel } }, description: 'Todo deleted' },
    404: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: ErrorResponseModel } }, description: 'Internal error' },
  },
})
