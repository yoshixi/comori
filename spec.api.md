# Shuchu API Specification

## Overview
This document describes the REST API for the Shuchu task management application. The API provides endpoints for managing tasks and their associated focus timers.

## Base URL
```
/api
```

## Data Models

### Task
```typescript
interface Task {
  id: string              // Unique identifier (UUID)
  title: string           // Task title (required)
  description: string     // Task description
  status: TaskStatus      // Current status
  dueDate?: string        // Due date in YYYY-MM-DD format (optional)
  createdAt: string       // ISO 8601 timestamp
  updatedAt: string       // ISO 8601 timestamp
}
```

### TaskStatus
```typescript
type TaskStatus = 'To Do' | 'In Progress' | 'Done'
```

### TaskTimer
```typescript
interface TaskTimer {
  id: string              // Unique identifier (UUID)
  taskId: string          // Associated task ID (foreign key)
  startTime: string       // ISO 8601 timestamp when timer started
  endTime?: string        // ISO 8601 timestamp when timer ended (optional)
  createdAt: string       // ISO 8601 timestamp
  updatedAt: string       // ISO 8601 timestamp
}
```

## Tasks API

### GET /tasks
Retrieve all tasks with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by task status. Values: `all`, `To Do`, `In Progress`, `Done`

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "status": "To Do",
      "dueDate": "2024-01-15",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved tasks

### GET /tasks/:id
Retrieve a specific task by ID.

**Path Parameters:**
- `id`: Task ID (UUID)

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "status": "To Do",
    "dueDate": "2024-01-15",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK`: Task found and returned
- `404 Not Found`: Task not found

### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "New task title",           // required
  "description": "Task description",   // optional
  "status": "To Do",                   // optional, defaults to "To Do"
  "dueDate": "2024-01-15"             // optional
}
```

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "New task title",
    "description": "Task description",
    "status": "To Do",
    "dueDate": "2024-01-15",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created`: Task successfully created
- `400 Bad Request`: Invalid request data (e.g., missing title)

### PUT /tasks/:id
Update an existing task.

**Path Parameters:**
- `id`: Task ID (UUID)

**Request Body:**
```json
{
  "title": "Updated title",           // optional
  "description": "Updated description", // optional
  "status": "In Progress",            // optional
  "dueDate": "2024-01-20"            // optional (null to remove)
}
```

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "Updated title",
    "description": "Updated description",
    "status": "In Progress",
    "dueDate": "2024-01-20",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T15:30:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK`: Task successfully updated
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Task not found

### DELETE /tasks/:id
Delete a task and all associated timers.

**Path Parameters:**
- `id`: Task ID (UUID)

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "title": "Deleted task",
    "description": "Task description",
    "status": "To Do",
    "dueDate": "2024-01-15",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK`: Task successfully deleted
- `404 Not Found`: Task not found

## Timers API

### GET /timers
Retrieve all timers across all tasks.

**Response:**
```json
{
  "timers": [
    {
      "id": "uuid",
      "taskId": "task-uuid",
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-01-01T10:25:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:25:00.000Z"
    }
  ],
  "total": 1
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved timers

### GET /tasks/:taskId/timers
Retrieve all timers for a specific task.

**Path Parameters:**
- `taskId`: Task ID (UUID)

**Response:**
```json
{
  "timers": [
    {
      "id": "uuid",
      "taskId": "task-uuid",
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-01-01T10:25:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:25:00.000Z"
    }
  ],
  "total": 1
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved timers
- `404 Not Found`: Task not found

### GET /timers/:id
Retrieve a specific timer by ID.

**Path Parameters:**
- `id`: Timer ID (UUID)

**Response:**
```json
{
  "timer": {
    "id": "uuid",
    "taskId": "task-uuid",
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:25:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:25:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK`: Timer found and returned
- `404 Not Found`: Timer not found

### POST /timers
Start a new timer for a task.

**Request Body:**
```json
{
  "taskId": "task-uuid",                    // required
  "startTime": "2024-01-01T10:00:00.000Z"  // required (ISO 8601)
}
```

**Response:**
```json
{
  "timer": {
    "id": "uuid",
    "taskId": "task-uuid",
    "startTime": "2024-01-01T10:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created`: Timer successfully created
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Task not found

### PUT /timers/:id
Update a timer (typically to set end time).

**Path Parameters:**
- `id`: Timer ID (UUID)

**Request Body:**
```json
{
  "endTime": "2024-01-01T10:25:00.000Z"  // optional (ISO 8601)
}
```

**Response:**
```json
{
  "timer": {
    "id": "uuid",
    "taskId": "task-uuid",
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:25:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:25:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK`: Timer successfully updated
- `404 Not Found`: Timer not found

### DELETE /timers/:id
Delete a timer.

**Path Parameters:**
- `id`: Timer ID (UUID)

**Response:**
```json
{
  "timer": {
    "id": "uuid",
    "taskId": "task-uuid",
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:25:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:25:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK`: Timer successfully deleted
- `404 Not Found`: Timer not found

## Health Check

### GET /health
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "message": "Shuchu API is running",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: API is healthy

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes used:
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## CORS

The API supports Cross-Origin Resource Sharing (CORS) for all routes to allow frontend applications to access the API from different domains.

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. Task IDs and Timer IDs are UUIDs
3. When a task is deleted, all associated timers are automatically deleted
4. The `dueDate` field uses YYYY-MM-DD format for consistency with HTML date inputs
5. Task status changes are immediate and reflected in the `updatedAt` timestamp
6. Timers without an `endTime` are considered active/running