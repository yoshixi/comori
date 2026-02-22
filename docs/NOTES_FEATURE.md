---
title: "Notes Feature"
brief_description: "Lightweight scratchpad for capturing rough ideas before formalizing them as tasks."
created_at: "2026-02-22"
update_at: "2026-02-22"
---

# Notes Feature

A lightweight scratchpad for capturing rough ideas that are too early to formalize as tasks. Notes are a first-class resource with CRUD operations, archiving, and a "Convert to Task" action that promotes a note into the task system when the idea is ready.

## Design Decisions

- **No tags on notes** -- notes are intentionally lightweight. Tags can be assigned after conversion to a task.
- **First line = title** -- a single textarea is used for editing. The first line is treated as the title and the rest as content.
- **Soft-delete via `archivedAt`** -- archiving hides the note without deleting it. Archived notes can be shown via the "Archived" toggle.
- **`note_task_conversions` table** -- tracks conversion history (which note became which task). Internal-only, no UI needed for now.
- **Sorted by `updatedAt` desc** -- most recently edited notes appear first.

## Key Files

### Backend

- `apps/backend/src/app/db/schema/schema.ts` -- `notesTable` and `noteTaskConversionsTable` definitions.
- `apps/backend/src/app/core/notes.core.ts` -- Zod/OpenAPI schemas: `NoteModel`, `CreateNoteModel`, `UpdateNoteModel` (includes `archivedAt`), `ConvertNoteToTaskRequestModel`.
- `apps/backend/src/app/core/notes.db.ts` -- Database layer: `getAllNotes`, `getNoteById`, `createNote`, `updateNote`, `deleteNote`, `archiveNote`, `recordConversion`.
- `apps/backend/src/app/api/[[...route]]/routes/notes.ts` -- 6 OpenAPI route definitions.
- `apps/backend/src/app/api/[[...route]]/handlers/notes.ts` -- 6 route handlers.

### Electron Frontend

- `apps/electron/src/renderer/src/hooks/useNotesData.ts` -- SWR-based data hook with optimistic updates. Exports `splitNoteText` / `mergeNoteText` utilities.
- `apps/electron/src/renderer/src/components/NotesView.tsx` -- Notes page: composer, note cards, archive toggle, convert-to-task dialog.
- `apps/electron/src/renderer/src/components/Sidebar.tsx` -- "Notes" entry in the sidebar navigation.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | List notes (query: `includeArchived`) |
| GET | `/api/notes/:id` | Get a single note |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Update a note (title, content, archivedAt) |
| DELETE | `/api/notes/:id` | Permanently delete a note |
| POST | `/api/notes/:id/task_conversions` | Convert note to task (optional `startAt`/`endAt`) |

## Database Schema

### `notes` table

| Column | Type | Description |
|--------|------|-------------|
| id | integer (PK) | Auto-increment |
| user_id | integer (FK) | References `users.id`, CASCADE delete |
| title | text | Note title (first line of content) |
| content | text (nullable) | Remaining content after the first line |
| archived_at | integer (timestamp, nullable) | Set when archived or converted to task |
| created_at | integer (timestamp) | Auto-set on creation |
| updated_at | integer (timestamp) | Auto-set on creation and update |

### `note_task_conversions` table

| Column | Type | Description |
|--------|------|-------------|
| id | integer (PK) | Auto-increment |
| note_id | integer (FK) | References `notes.id`, CASCADE delete |
| task_id | integer (FK) | References `tasks.id`, CASCADE delete |
| created_at | integer (timestamp) | When the conversion happened |

## UI Behavior

### Composer

- A single auto-resizing textarea at the top of the Notes page.
- Note is auto-created on blur if content is not empty.
- `Cmd+Enter` also submits.

### Note Cards

- Clicking a card enters edit mode showing the full content in a textarea with the cursor at the end.
- First line is displayed as bold title, rest as muted content preview.
- Action buttons: Convert to Task, Archive, Delete.
- Archived notes render with reduced opacity.

### Convert to Task

- Opens a confirmation dialog with a `TaskTimeRangePicker` for optional scheduling.
- Three actions: Cancel, Convert without schedule, Convert with schedule.
- Conversion atomically creates a task, records the conversion, and archives the note.

### Archived Toggle

- "Archived" switch in the Notes page header controls visibility of archived notes.
- Off by default -- only active notes are shown.
