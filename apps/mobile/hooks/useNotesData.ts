import { useCallback } from 'react'
import { useSWRConfig } from 'swr'
import {
  deleteApiV1NotesId,
  postApiV1Notes,
  patchApiV1NotesId,
  useGetApiV1Notes,
} from '@/gen/api/endpoints/techooAPI.gen'
import type { Note } from '@/gen/api/schemas'

export function splitNoteText(text: string): { title: string; body: string | null } {
  const lines = text.split('\n')
  const title = (lines[0] || '').trim() || 'Untitled'
  const rest = lines.slice(1).join('\n').trim()
  return { title, body: rest || null }
}

export function mergeNoteText(note: Note): string {
  if (note.body?.trim()) return `${note.title}\n${note.body}`
  return note.title
}

export interface UseNotesDataReturn {
  notes: Note[]
  notesLoading: boolean
  notesError: unknown
  mutateNotes: ReturnType<typeof useGetApiV1Notes>['mutate']
  handleCreateNote: (text: string) => void
  handleUpdateNote: (noteId: string, text: string) => void
  handleDeleteNote: (noteId: string) => Promise<void>
  handleTogglePin: (noteId: string, pinned: number) => Promise<void>
  refreshNotes: () => Promise<void>
}

export function useNotesData(): UseNotesDataReturn {
  const { mutate: globalMutate } = useSWRConfig()
  const {
    data: notesResponse,
    error: notesError,
    isLoading: notesLoading,
    mutate: mutateNotes,
  } = useGetApiV1Notes()

  const notes = notesResponse?.data ?? []

  const refreshNotes = useCallback(async () => {
    await globalMutate(
      (key) => Array.isArray(key) && key[0] === '/api/v1/notes',
      undefined,
      { revalidate: true }
    )
  }, [globalMutate])

  const handleCreateNote = useCallback(
    (text: string) => {
      if (!text.trim()) return
      const { title, body } = splitNoteText(text)
      const now = Math.floor(Date.now() / 1000)
      const tempId = `temp-${now}`

      const optimisticNote: Note = {
        id: tempId,
        title,
        body,
        pinned: 0,
        created_at: now,
        updated_at: now,
      }

      mutateNotes(
        (currentData) => {
          if (!currentData) return { data: [optimisticNote] }
          return { data: [optimisticNote, ...currentData.data] }
        },
        { revalidate: false }
      )

      postApiV1Notes({ title, body: body ?? undefined })
        .then(async () => {
          await mutateNotes()
        })
        .catch(async () => {
          await mutateNotes()
        })
    },
    [mutateNotes]
  )

  const handleUpdateNote = useCallback(
    (noteId: string, text: string) => {
      const { title, body } = splitNoteText(text)
      const now = Math.floor(Date.now() / 1000)

      mutateNotes(
        (currentData) => {
          if (!currentData) return currentData
          return {
            data: currentData.data.map((n) =>
              n.id === noteId ? { ...n, title, body, updated_at: now } : n
            ),
          }
        },
        { revalidate: false }
      )

      patchApiV1NotesId(noteId, { title, body })
        .then(() => mutateNotes())
        .catch(() => mutateNotes())
    },
    [mutateNotes]
  )

  const handleDeleteNote = useCallback(
    async (noteId: string): Promise<void> => {
      mutateNotes(
        (currentData) => {
          if (!currentData) return currentData
          return { data: currentData.data.filter((n) => n.id !== noteId) }
        },
        { revalidate: false }
      )
      try {
        await deleteApiV1NotesId(noteId)
      } catch {
        await mutateNotes()
      }
    },
    [mutateNotes]
  )

  const handleTogglePin = useCallback(
    async (noteId: string, pinned: number): Promise<void> => {
      await patchApiV1NotesId(noteId, { pinned })
      await mutateNotes()
    },
    [mutateNotes]
  )

  return {
    notes,
    notesLoading,
    notesError,
    mutateNotes,
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote,
    handleTogglePin,
    refreshNotes,
  }
}
