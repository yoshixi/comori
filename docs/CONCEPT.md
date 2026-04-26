---
title: "Techo - Product Concept"
brief_description: "Techo - Product Concept"
created_at: "2026-02-12"
update_at: "2026-04-11"
---

# Techo - Product Concept

## One-liner

Techo is a daily planner: you lay out the day with calendar to-dos, narrate it with posts as you go, and keep private capture in notes—one place for both your planned day and your day-to-day life.

## Name and metaphor

**Techo** (手帳) evokes the everyday planner—paper or digital—that holds *the day*. The product name grows out of **Techoo**, playing on the Japanese word for that kind of daily book. The app is not meant to be only a task list; it is meant to feel like **planning and writing the day on your techo**.

## The Problem

People juggle intent (“what I meant to do today”), what actually happened, and everything else (thoughts, snippets, non-scheduled life). Those pieces often live in separate apps or nowhere durable. The day becomes hard to see as a whole: the plan, the log, and private notes drift apart.

## Core Insight

If **the schedule**, **a lightweight log**, and **free-form notes** share one daily surface, you get a coherent picture of *your* day without heavyweight project management. Planning stays visual and time-based; remembering stays easy; capture that does not belong on the calendar still has a home.

## Who It's For

Individuals planning and reflecting on their own days: knowledge workers, students, freelancers, anyone who wants a **personal** daily planner with calendar, log, and notes—not teams, not enterprise roadmaps. Just you and your day.

## Core resources

Techo is built around three kinds of content. Each has a clear role so the app can cover **private day-to-day plan and logs** without forcing everything into one shape.

### 1. To-dos on the calendar — “what I’m doing with my day”

To-dos belong **on the calendar** because planning here means **time and intent**: blocks and moments when you mean to do something. That mirrors opening a techo and **writing the day’s plan in the grid**, not dumping an undated backlog.

### 2. Posts — “what happened”

As the day runs, **posts** are the **log**: short, chronological entries—often tied to the moment or linked to a calendar event or to-do you were in. Posts are not the same as the plan; they are how the day **reads back** after you live it.

### 3. Notes — “not on the day’s timeline”

**Notes** hold capture that does not need to sit on the schedule or in the log stream: ideas, reference, longer writing, journal-style pages. They let Techo cover **the rest of private day-to-day life** without pretending every thought is a to-do or a post.

**External calendar events** (for example from Google Calendar) appear as read-only context on the same day so your plan and the world’s schedule stay in one view.

## Design Principles

### 1. The day is the unit of attention

Screens and flows should reinforce **today and the near horizon** (this week), not multi-month roadmaps. The product is optimized for seeing and editing *this* day’s plan and story.

### 2. Plan on the calendar, story in posts

The calendar answers **“what did I plan?”** Posts answer **“what was it like?”** Keeping that distinction clear avoids collapsing planning and journaling into one undifferentiated list.

### 3. Notes stay optional and free

Notes should feel **unstructured** relative to to-dos and posts: no requirement to schedule or timestamp every private thought. If it belongs in a notebook page, it belongs in notes.

### 4. Lightweight structure

Prefer small, clear fields over heavy metadata. Richness comes from **how** items relate (time, links between posts and events/to-dos) and from consistent daily habits, not from filling many custom columns.

### 5. Glanceable day

You should be able to answer **“what’s my day?”** and **“what did I note today?”** quickly. Summaries exist for you, not for reporting up a chain of command.

## Primary surfaces (conceptual)

- **Today / timeline-oriented views** — Compose calendar context, today’s to-dos, and posts so the day is readable at a glance.
- **Calendar** — Week (and related) views: external events plus **your** to-dos as the planned layer of the day.
- **Posts** — Chronological log, composer with context from the current schedule when helpful.
- **To-dos** — Today-first lists that align with how items sit on the calendar; incomplete work across days when needed.
- **Notes** — List and editor: pinned items, search, content that sits outside the strict plan/log timeline.

Exact layouts may evolve; the **roles** of calendar, posts, and notes stay stable.

## What Techo Is Not

- **Not a team tool.** Single-user by design: your techo, not a shared workspace.
- **Not full project management.** No Gantt charts, dependencies, or enterprise workflows.
- **Not a replacement for every specialist app.** It integrates calendar context and daily capture; deep specialist needs may still use other tools.

## Technical Context

- **Desktop app** (Electron) with a Hono API backend (Cloudflare Workers)
- **Mobile companion** (Expo, `apps/mobile`) uses the same API for today’s to-dos, posts, calendar context, and notes
- **Multi-tenant data** with per-user databases; authentication and OAuth for services such as Google Calendar
- **Auto-generated API client** from OpenAPI spec keeps frontend and backend in sync
- **SWR** for data fetching with optimistic updates so the UI stays responsive

## Lineage

Techo evolves ideas from the earlier **Techoo** concept, which emphasized **planned vs. actual time** with timers and tasks. Techo keeps the spirit of **honest, personal daily planning** while shifting the model to **calendar to-dos, posts as logs, and notes for everything else**.

## Future Directions (Not Committed)

Possible extensions—not committed roadmap—used to test whether ideas still fit the techo metaphor.

- **Deeper “day review”** — A single end-of-day read that contrasts planned blocks, completed to-dos, and posts.
- **Lightweight AI assistance** — Suggestions or summaries that respect the user’s private data and the day-as-one-page idea.
- **Mobile companion** — Extend capture and day views on the go (see `apps/mobile` README).
- **Richer linking** — Stronger connections between posts, events, and to-dos without turning the product into a graph database for casual users.
