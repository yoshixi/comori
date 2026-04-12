# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Techoo is a personal time-tracking app that makes it easy to see planned vs. actual progress for short-term tasks. Built as a monorepo with a Next.js backend API and an Electron desktop client. Uses Turbo for build orchestration and pnpm for package management. See `docs/CONCEPT.md` for the full product concept.

## Agent Notes
- Always run `pnpm run check-types` after making edits to ensure we keep the repo type-safe. Keep this as part of your default workflow.
- Put the implementation plans to agents/plans
- Put the general specifications to docs. The docs should work as guides for new developers. So it doesn't have to have too specific things. Ideal way is the developer should check docs first, then to nail down the specifications, they should find out the history from the agents/plans and codes.

## Development Environment

This project uses **Nix flakes** for environment management. The development shell is activated automatically via direnv, or manually:

```sh
nix develop  # Enter the development environment
```

**Agents and automation:** run repo commands via `nix develop --command …` from the repo root so the correct toolchain is used and host shell hooks do not interfere. See `AGENTS.md` → *Development environment (read this first)*.

The flake provides:
- Git, pnpm, and turso-cli
- Python environment for SQLite operations (node-gyp / better-sqlite3)

## Common Commands

### Building and Running

```sh
# Start all apps in development mode (uses default database config)
pnpm run dev

# Start web app with local SQLite database
pnpm --filter web run dev:local

# Start web app with production Turso database (requires TURSO env vars)
pnpm --filter web run dev:prod

# Build all apps and packages
pnpm run build

# Run linting across all packages
pnpm run lint

# Type checking across all packages
pnpm run check-types

# Format code
pnpm run format
```

### Testing

```sh
# Run all tests
pnpm run test

# Run tests for a specific package
pnpm --filter web run test:oneshot

# Watch mode for tests in web app
pnpm --filter web run test:watch
```

### Package Management

```sh
# Add a dependency to a specific package
pnpm --filter web add <package-name>
pnpm --filter electron add -D <package-name>
```

### Database Operations (Backend)

The backend uses Drizzle ORM with a multi-tenant architecture:
- **Main DB** (Turso): Stores auth tables (users, sessions, accounts, verifications)
- **Tenant DBs** (Turso, per-user): Stores domain data (todos, posts, notes, calendars, events)
- **Seed DB** (Turso): Template database cloned when creating new tenant DBs

**Running the API server:**
```sh
# Start backend with wrangler (uses .env for config)
pnpm --filter @apps/backend run dev
```

**Schema changes require updating multiple databases:**

```sh
# 1. Push schema to the seed database (template for new tenants)
#    Uses .env by default, or set DOTENV_CONFIG_PATH to override
pnpm --filter @apps/backend run drizzle:push:seed

# 2. Push schema to all existing tenant databases
pnpm --filter @apps/backend run migrate-all

# 3. For local development only — push to local SQLite
pnpm --filter @apps/backend exec drizzle-kit push --config ./drizzle.config.ts
```

**After schema changes, the full workflow is:**
1. Edit `apps/backend/src/app/db/schema/schema.ts`
2. Push to seed DB: `pnpm --filter @apps/backend run drizzle:push:seed`
3. Push to existing tenant DBs: `pnpm --filter @apps/backend run migrate-all`
4. Restart the dev server

### Changing Database Schema

1. **Modify the schema**
   - Edit `apps/backend/src/app/db/schema/schema.ts`

2. **Push schema to seed DB** (template for new tenant DBs)
   ```sh
   pnpm --filter @apps/backend run drizzle:push:seed
   ```

3. **Push schema to existing tenant DBs**
   ```sh
   pnpm --filter @apps/backend run migrate-all
   ```

4. **Restart the dev server** and verify

**Important notes:**
- The seed DB must always be updated first — new tenants are cloned from it
- Existing tenant DBs are not automatically updated; use `migrate-all` after schema changes
- Ensure you are in the nix development shell (via direnv or `nix develop`)
- Schema file: `apps/backend/src/app/db/schema/schema.ts`
- Seed config: `apps/backend/drizzle.config.seed.ts`

### Electron App

```sh
# Development
pnpm --filter electron run dev

# Development with API connection
pnpm --filter electron run dev:api

# Build for different platforms
pnpm --filter electron run build:mac
pnpm --filter electron run build:win
pnpm --filter electron run build:linux

# Generate TypeScript API client from OpenAPI schema
pnpm --filter electron run api:generate
```

## Architecture

### Monorepo Structure

- **apps/web**: Next.js application with Hono API backend
- **apps/electron**: Electron desktop application
- **apps/docs**: Documentation site
- **packages/ui**: Shared UI components
- **packages/eslint-config**: Shared ESLint configuration
- **packages/typescript-config**: Shared TypeScript configurations
- **scripts/openapischema-generator**: Generates OpenAPI schema from Hono routes

### Web App (Backend API)

The web app is a Next.js application that serves a Hono-based REST API at `/api`:

**Key directories:**
- `app/api/[[...route]]`: API implementation using Hono with OpenAPI
  - `routes/`: OpenAPI route definitions (using @hono/zod-openapi)
  - `handlers/`: Route handler implementations
  - `route.ts`: Main API entry point, exports `honoApp` for schema generation
- `app/core/`: Business logic layer
  - `*.core.ts`: Domain logic and business rules
  - `*.db.ts`: Database access layer using Drizzle ORM
- `app/db/schema/`: Drizzle ORM schema definitions

**API Pattern:**
1. Routes are defined with OpenAPI specifications in `routes/`
2. Handlers implement the business logic in `handlers/`
3. Handlers use core modules from `app/core/` for business logic
4. Core modules use `*.db.ts` files for database operations
5. OpenAPI documentation is available at `/api/doc`

**Database Schema:**
- `usersTable`: User information
- `tasksTable`: Task management with due dates, completion status, and timestamps
- `taskTimersTable`: Time tracking for tasks with start/end times

All tables use integer auto-increment IDs and Unix timestamps for time fields.

### Electron App

The Electron app consumes the web API via auto-generated TypeScript clients:

**Key directories:**
- `src/main/`: Electron main process (window management, IPC)
- `src/renderer/`: React frontend application
- `src/renderer/src/gen/api/`: Auto-generated API client from OpenAPI schema
- `src/preload/`: Electron preload scripts

**API Client Generation:**
1. `pnpm --filter electron run gen:openapi` generates `openapi.json` from the Hono app
2. `pnpm --filter electron run orval:generate` generates TypeScript clients using Orval
3. Orval uses SWR for React hooks and a custom mutator (`src/renderer/src/lib/api/mutator.ts`)

**Renderer Architecture:**
The renderer is organized around three main views:
- **Calendar** (`CalendarView.tsx`): Day/week timeline for visual planning
- **Tasks** (`TasksView.tsx`): Tabbed view with Now (quick capture + running timers), Upcoming (date-grouped planning), and Review (time charts + summaries)
- **Account** (`AccountView.tsx`): User settings

Shared data fetching and mutations live in `hooks/useTasksData.ts`. UI primitives follow the shadcn/ui pattern under `components/ui/`.

### Shared Packages

- **packages/ui**: Shared React components (shadcn/ui based)
- **packages/eslint-config**: ESLint configuration for the monorepo
- **packages/typescript-config**: Base TypeScript configs (`base.json`, `nextjs.json`, `react-library.json`)

## Key Technologies

- **Turborepo**: Monorepo build system
- **Next.js 16**: Web framework for the API backend
- **Hono**: Fast web framework with OpenAPI support
- **Drizzle ORM**: TypeScript ORM for SQLite/Turso
- **Electron**: Desktop application framework
- **React 19**: UI framework
- **Tailwind CSS 4**: Styling
- **SWR**: Data fetching for React
- **Orval**: OpenAPI code generator
- **Vitest**: Testing framework
- **Nix flakes**: Development environment manager

## Planning Documentation

Planning documents should be placed in the `agents/plans/` directory.

## Development Logs

At the end of each session, create a dev-log in `apps/electron/dev-logs/` documenting:
- What was implemented
- Commands executed (especially for manual procedures like icon generation)

**File naming format:** `YYYY-MM-DD-$BRANCH_NAME-$WORKTITLE.md`

Example: `2026-01-12-shuchu-desktop-app-build-electron-release-workflow.md`

## Environment Variables

Required for production database operations:
- `TURSO_CONNECTION_URL`: Turso database connection URL
- `TURSO_AUTH_TOKEN`: Turso authentication token
- `TURSO_DATABASE_URL`: Alternative Turso database URL format

## Important Notes

- The project uses pnpm workspaces with specific package overrides for React 19 and esbuild
- Only specified dependencies (better-sqlite3, electron, esbuild, sharp) should be built from source
- Tests in Electron app are not yet implemented (`echo 'No tests for electron yet'`)
- API changes require regenerating the Electron client (`api:generate` command)
