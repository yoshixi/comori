import { createRoute } from '@hono/zod-openapi'
import {
  NoteListResponseModel,
  NoteQueryParamsModel,
  NoteIdParamModel,
  NoteResponseModel,
  CreateNoteModel,
  UpdateNoteModel,
  ConvertNoteToTaskRequestModel,
  ConvertNoteToTaskResponseModel
} from '../../../core/notes.core'
import { ErrorResponseModel } from '../../../core/common.core'

// GET /notes - List all notes
export const listNotesRoute = createRoute({
  method: 'get',
  path: '/notes',
  summary: 'Get all notes',
  description: 'Retrieve all notes for the current user. By default, archived notes are excluded.',
  request: {
    query: NoteQueryParamsModel
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: NoteListResponseModel
        }
      },
      description: 'Notes retrieved successfully'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Internal server error'
    }
  }
})

// GET /notes/{id} - Get a specific note
export const getNoteRoute = createRoute({
  method: 'get',
  path: '/notes/{id}',
  summary: 'Get a note',
  description: 'Retrieve a specific note by ID',
  request: {
    params: NoteIdParamModel
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: NoteResponseModel
        }
      },
      description: 'Note retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Note not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Internal server error'
    }
  }
})

// POST /notes - Create a new note
export const createNoteRoute = createRoute({
  method: 'post',
  path: '/notes',
  summary: 'Create a note',
  description: 'Create a new note',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateNoteModel
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: NoteResponseModel
        }
      },
      description: 'Note created successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Bad request - invalid input'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Internal server error'
    }
  }
})

// PUT /notes/{id} - Update an existing note
export const updateNoteRoute = createRoute({
  method: 'put',
  path: '/notes/{id}',
  summary: 'Update a note',
  description: 'Update an existing note by ID',
  request: {
    params: NoteIdParamModel,
    body: {
      content: {
        'application/json': {
          schema: UpdateNoteModel
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: NoteResponseModel
        }
      },
      description: 'Note updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Note not found'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Bad request - invalid input'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Internal server error'
    }
  }
})

// DELETE /notes/{id} - Delete a note
export const deleteNoteRoute = createRoute({
  method: 'delete',
  path: '/notes/{id}',
  summary: 'Delete a note',
  description: 'Delete a note by ID',
  request: {
    params: NoteIdParamModel
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: NoteResponseModel
        }
      },
      description: 'Note deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Note not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Internal server error'
    }
  }
})

// POST /notes/{id}/task_conversions - Convert a note to a task
export const convertNoteToTaskRoute = createRoute({
  method: 'post',
  path: '/notes/{id}/task_conversions',
  summary: 'Convert a note to a task',
  description: 'Atomically creates a task from the note, records the conversion, and archives the note.',
  request: {
    params: NoteIdParamModel,
    body: {
      content: {
        'application/json': {
          schema: ConvertNoteToTaskRequestModel
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ConvertNoteToTaskResponseModel
        }
      },
      description: 'Note converted to task successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Note not found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Internal server error'
    }
  }
})
