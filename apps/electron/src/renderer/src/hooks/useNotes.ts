import {
  useGetApiV1Notes,
  postApiV1Notes,
  patchApiV1NotesId,
  deleteApiV1NotesId
} from '../gen/api/endpoints/techooAPI.gen'
import type { ErrorResponse, Note, UpdateNote } from '../gen/api/schemas'
import { useCallback } from 'react'

export function useNotes(): {
  notes: Note[]
  isLoading: boolean
  error: ErrorResponse | undefined
  createNote: (title: string) => Promise<void>
  updateNote: (id: string, update: UpdateNote) => Promise<void>
  deleteNote: (id: string) => Promise<void>
} {
  const { data, error, isLoading, mutate } = useGetApiV1Notes()

  const notes = data?.data ?? []

  const createNote = useCallback(
    async (title: string) => {
      await postApiV1Notes({ title })
      await mutate()
    },
    [mutate]
  )

  const updateNote = useCallback(
    async (id: string, update: UpdateNote) => {
      await patchApiV1NotesId(id, update)
      await mutate()
    },
    [mutate]
  )

  const deleteNote = useCallback(
    async (id: string) => {
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
