import { useCallback } from 'react'
import {
  deleteApiNotesId,
  postApiNotes,
  putApiNotesId,
  postApiNotesIdTaskConversions,
  useGetApiNotes,
  type Note
} from '../gen/api'

/** Split raw text into title (first line) and content (rest). */
export function splitNoteText(text: string): { title: string; content: string | null } {
  const lines = text.split('\n')
  const title = (lines[0] || '').trim() || 'Untitled'
  const rest = lines.slice(1).join('\n').trim()
  return { title, content: rest || null }
}

/** Merge title and content back into a single text block. */
export function mergeNoteText(note: Note): string {
  if (note.content) return `${note.title}\n${note.content}`
  return note.title
}

export interface UseNotesDataReturn {
  notes: Note[]
  notesLoading: boolean
  notesError: unknown
  mutateNotes: ReturnType<typeof useGetApiNotes>['mutate']
  handleCreateNote: (text: string) => void
  handleUpdateNote: (noteId: number, text: string) => void
  handleDeleteNote: (noteId: number) => Promise<void>
  handleConvertToTask: (noteId: number, schedule?: { startAt?: string; endAt?: string }) => Promise<void>
}

export function useNotesData(): UseNotesDataReturn {
  const {
    data: notesResponse,
    error: notesError,
    isLoading: notesLoading,
    mutate: mutateNotes
  } = useGetApiNotes()

  const notes = notesResponse?.notes ?? []

  const handleCreateNote = useCallback((text: string) => {
    if (!text.trim()) return

    const { title, content } = splitNoteText(text)
    const now = new Date().toISOString()
    const tempId = -Date.now()

    const optimisticNote: Note = {
      id: tempId,
      title,
      content,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    }

    mutateNotes(
      (currentData) => {
        if (!currentData) return currentData
        return {
          ...currentData,
          notes: [optimisticNote, ...currentData.notes],
          total: currentData.total + 1
        }
      },
      { revalidate: false }
    )

    postApiNotes({ title, content: content ?? undefined })
      .then((response) => {
        mutateNotes(
          (currentData) => {
            if (!currentData) return currentData
            return {
              ...currentData,
              notes: currentData.notes.map((n) => n.id === tempId ? response.note : n)
            }
          },
          { revalidate: false }
        )
      })
      .catch((error) => {
        console.error('Failed to create note:', error)
        mutateNotes(
          (currentData) => {
            if (!currentData) return currentData
            return {
              ...currentData,
              notes: currentData.notes.filter((n) => n.id !== tempId),
              total: currentData.total - 1
            }
          },
          { revalidate: false }
        )
      })
  }, [mutateNotes])

  const handleUpdateNote = useCallback((noteId: number, text: string) => {
    const { title, content } = splitNoteText(text)

    // Optimistic update
    mutateNotes(
      (currentData) => {
        if (!currentData) return currentData
        return {
          ...currentData,
          notes: currentData.notes.map((n) =>
            n.id === noteId ? { ...n, title, content, updatedAt: new Date().toISOString() } : n
          )
        }
      },
      { revalidate: false }
    )

    putApiNotesId(noteId, { title, content })
      .then(() => mutateNotes())
      .catch((error) => {
        console.error('Failed to update note:', error)
        mutateNotes()
      })
  }, [mutateNotes])

  const handleDeleteNote = useCallback(async (noteId: number): Promise<void> => {
    // Optimistic delete
    mutateNotes(
      (currentData) => {
        if (!currentData) return currentData
        return {
          ...currentData,
          notes: currentData.notes.filter((n) => n.id !== noteId),
          total: currentData.total - 1
        }
      },
      { revalidate: false }
    )

    try {
      await deleteApiNotesId(noteId)
    } catch (error) {
      console.error('Failed to delete note:', error)
      await mutateNotes()
    }
  }, [mutateNotes])

  const handleConvertToTask = useCallback(async (noteId: number, schedule?: { startAt?: string; endAt?: string }): Promise<void> => {
    // Optimistic remove from list
    mutateNotes(
      (currentData) => {
        if (!currentData) return currentData
        return {
          ...currentData,
          notes: currentData.notes.filter((n) => n.id !== noteId),
          total: currentData.total - 1
        }
      },
      { revalidate: false }
    )

    try {
      await postApiNotesIdTaskConversions(noteId, {
        startAt: schedule?.startAt,
        endAt: schedule?.endAt
      })
    } catch (error) {
      console.error('Failed to convert note to task:', error)
      await mutateNotes()
    }
  }, [mutateNotes])

  return {
    notes,
    notesLoading,
    notesError,
    mutateNotes,
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote,
    handleConvertToTask
  }
}
