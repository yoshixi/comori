# Review Panel UI/UX Revamp Plan

## Problem

The Review tab currently shows a fixed 14-day summary with three sections (daily hours chart, time-by-tag chart, task summary table). But users primarily care about **what they did today or yesterday** — a 14-day view buries recent activity in noise. Different time horizons serve different user needs, and the UI should adapt accordingly.

## Core Insight

| Period | User Intent | What matters |
|--------|------------|--------------|
| **Today** | "What am I doing right now?" | Active timers, session log, running total |
| **Yesterday** | "What did I accomplish?" | Completed sessions, total hours, task list |
| **This Week** | "Am I on track?" | Daily trend, tag distribution |
| **Last 14 days** | "What are my patterns?" | Trend chart, tag breakdown, averages |

## Proposal: Period-Adaptive Review Panel

### 1. Period Selector (top of Review tab)

A segmented control with four options:

```
[ Today | Yesterday | This Week | 14 Days ]
```

- Default to **Today** (most immediately useful)
- Persist selection in localStorage so it remembers user preference

### 2. Period-Specific Layouts

#### Today View
Focus: **"Live dashboard"** — what's happening right now

- **Header Stats**: Total tracked today (e.g., "4h 23m"), number of sessions
- **Session Timeline**: Vertical timeline of today's timer sessions, most recent first
  - Each entry: task title, tags, start time → end time, duration
  - Active timer highlighted with a pulsing indicator
- **No charts** — not enough data points to be meaningful

#### Yesterday View
Focus: **"Daily recap"** — quick review of completed work

- **Header Stats**: Total tracked yesterday, session count, comparison vs daily average
- **Session Timeline**: Same as Today but for yesterday, sorted chronologically
- **Tag Breakdown**: Simple horizontal bar or pill-style breakdown showing time per tag
  - Inline/compact since it's just one day of data

#### This Week View (Mon–Sun)
Focus: **"Weekly pulse"** — am I keeping up?

- **Header Stats**: Total this week, daily average, comparison vs previous week
- **Daily Bar Chart**: One bar per day (Mon–Sun), today's bar highlighted
- **Tag Breakdown Chart**: Horizontal bar chart (same as current)
- **Task Summary Table**: Same as current, scoped to the week

#### 14 Days View
Focus: **"Trend analysis"** — patterns over time

- **Header Stats**: Total hours, daily average, most active day
- **Daily Bar Chart**: 14 bars (same as current)
- **Tag Breakdown Chart**: Horizontal bars (same as current)
- **Task Summary Table**: Same as current

### 3. Shared Components

All views share these building blocks, composed differently per period:

| Component | Used in |
|-----------|---------|
| `StatCard` (label + value + optional comparison) | All views |
| `SessionTimeline` (chronological session list) | Today, Yesterday |
| `DailyBarChart` (recharts bar chart) | This Week, 14 Days |
| `TagBreakdownChart` (horizontal bars) | Yesterday, This Week, 14 Days |
| `TaskSummaryTable` (sortable table) | This Week, 14 Days |

### 4. Data Fetching Changes

**Timers-first approach**: instead of fetching tasks first and then their timers, the review tab now fetches timers by date range first, then derives which tasks to display from the timer data.

- `useTasksData` accepts a `reviewPeriod` parameter: `"today" | "yesterday" | "week" | "14days"`
- A separate `useGetApiTimers` call with `startTimeFrom`/`startTimeTo` fetches review timers by date range
- Task metadata is derived from the existing `allTasks` collection
- The timer API was extended with `startTimeFrom` and `startTimeTo` query parameters (backend: `listTimers` function in `timers.db.ts`)
- The aggregation functions in `timer-aggregation.ts` already accept a `days` parameter, so they mostly work as-is
- Added `getSessionTimeline(timers, tasks, dateStart, dateEnd)` for the timeline view

### 5. Implementation Steps

1. **Add period selector state** to `ReviewTab` with localStorage persistence
2. **Update `useTasksData`** to accept dynamic date range for review queries
3. **Extract shared components** (`StatCard`, `SessionTimeline`) from existing code
4. **Build Today/Yesterday layouts** — these are new, timeline-focused views
5. **Refactor This Week / 14 Days layouts** — mostly reorganize existing chart code with stat headers
6. **Add comparison stats** (e.g., "vs last week") — optional enhancement

### 6. File Changes

| File | Change |
|------|--------|
| `ReviewTab.tsx` | Add period selector, conditional rendering per period |
| `useTasksData.ts` | Dynamic date range based on selected period |
| `timer-aggregation.ts` | Add `getSessionTimeline()`, keep existing functions |
| New: `components/review/StatCard.tsx` | Reusable stat display |
| New: `components/review/SessionTimeline.tsx` | Timeline for Today/Yesterday |
| New: `components/review/PeriodSelector.tsx` | Segmented control |

### 7. Design Notes

- Keep the visual style consistent with existing shadcn/ui components
- The period selector should feel lightweight — a segmented button group, not a dropdown
- Today view should feel "live" — if a timer is running, show elapsed time updating
- Yesterday view should feel "complete" — a finished summary you can glance at
- Avoid overwhelming the user; fewer elements per view is better than cramming everything in
