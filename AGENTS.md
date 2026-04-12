# Repository Guidelines

## Development environment (read this first)

The repo defines its toolchain with **Nix flakes** (`flake.nix`). **Agents and scripted terminals should run pnpm and other project commands inside that environment** so tool versions match the project and host shell plugins (e.g. `cd` hooks) do not break automation.

- Interactive shell: `nix develop` (from the repo root)
- One-shot command: `nix develop --command pnpm run check-types`
- If you use [direnv](https://direnv.net/) with `use flake`, an interactive shell may already be in the dev environment; for **non-interactive** runs, still prefer `nix develop --command …`.

Human-oriented setup details may also appear in `docs/DEV_ENVIROMENT.md` or `README.md`; when those disagree with `flake.nix`, **trust the flake** for what is actually installed.

## Project Structure & Module Organization
- `apps/web`: Next.js web app and API routes. Core logic in `apps/web/app/core`, DB schema in `apps/web/app/db`, and tests under `apps/web/**/**/*.test.ts`.
- `apps/electron`: Electron + React app (main, preload, renderer). Renderer UI lives in `apps/electron/src/renderer/src`.
- `apps/docs`: Next.js docs site.
- `packages/ui`: Shared UI components.
- `packages/eslint-config` and `packages/typescript-config`: Shared lint/TS configs.
- `scripts/openapischema-generator`: OpenAPI schema generator.
- `ai-docs`: Planning docs and project notes.

## Build, Test, and Development Commands

Prefix these with `nix develop --command` when not already inside `nix develop` (see **Development environment** above).

- `pnpm run dev`: Run all apps via Turbo from the repo root.
- `pnpm run build`: Build all apps/packages via Turbo.
- `pnpm run lint`: Lint all apps/packages via Turbo.
- `pnpm run test`: Run all tests via Turbo.
- `pnpm --filter web dev`: Run only the web app (port 3000). `--filter docs` uses port 3001.
- `pnpm --filter electron dev`: Run the Electron app locally.
- `pnpm --filter mobile run dev`: Run the mobile app locally (Expo dev server).

## Coding Style & Naming Conventions
- TypeScript-first, React/Next for web/docs, Electron + Vite for desktop.
- Use 2-space indentation (Prettier default). Run `pnpm run format` at the root or `pnpm --filter electron format`.
- ESLint is enforced per app; prefer shared configs under `packages/eslint-config`.
- Naming: React components in `PascalCase.tsx`, utilities in `camelCase.ts`, tests end with `.test.ts`.

## Testing Guidelines
- Web app tests use Vitest (`apps/web/vitest.config.ts`).
- Naming: `*.test.ts` in `apps/web` (e.g., `apps/web/app/api/**/tasks.test.ts`).
- Run web tests: `pnpm --filter web test` or `pnpm --filter web test:watch`.
- No formal coverage threshold is configured; keep coverage meaningful when adding features.

## Commit & Pull Request Guidelines
- Recent history shows short, descriptive messages (no strict convention). Prefer imperative summaries like “Add timer API validation”.
- PRs should describe scope, link related issues, and include screenshots for UI changes (web/docs/electron).

## Configuration & Data
- Example env files: `apps/web/.env.local.example` and `apps/web/.env.production.example`.
- Drizzle migrations live under `apps/web/drizzle/migrations`. Use `pnpm --filter web drizzle:push` for local schema updates.

## Agent Notes
- Place planning documents in `ai-docs/` as requested in `README.md`.
