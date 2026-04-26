import {
  useGetApiV1Notes,
  postApiV1Notes,
  patchApiV1NotesId,
  deleteApiV1NotesId
} from '../gen/api/endpoints/techooAPI.gen'
import type { ErrorResponse, GetApiV1NotesParams, Note, UpdateNote } from '../gen/api/schemas'
import { useCallback } from 'react'

/** Match backend `MAX_LIST_LIMIT` for notes list pagination. */
const NOTES_PAGE: GetApiV1NotesParams = { limit: 500, offset: 0 }

export function useNotes(): {
  notes: Note[]
  isLoading: boolean
  error: ErrorResponse | undefined
  createNote: (title: string) => Promise<void>
  updateNote: (id: number, update: UpdateNote) => Promise<void>
  deleteNote: (id: number) => Promise<void>
} {
  const { data, error, isLoading, mutate } = useGetApiV1Notes(NOTES_PAGE)

  const notes = data?.data ?? []

  const createNote = useCallback(
    async (title: string) => {
      await postApiV1Notes({ title })
      await mutate()
    },
    [mutate]
  )

  const updateNote = useCallback(
    async (id: number, update: UpdateNote) => {
      await patchApiV1NotesId(id, update)
      await mutate()
    },
    [mutate]
  )

  const deleteNote = useCallback(
    async (id: number) => {
      await deleteApiV1NotesId(id)
      await mutate()
    },
    [mutate]
  )

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote
  }
}
