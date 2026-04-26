# Techo — mobile companion

Expo app aligned with [`docs/CONCEPT.md`](../../docs/CONCEPT.md): **today’s to-dos**, **posts** (day log), **calendar** (to-dos + Google events), **notes** (off-timeline), and **settings** (OAuth / calendars).

## API client

Regenerate from the Electron OpenAPI export (keeps types in sync with the backend):

```bash
pnpm --filter mobile run api:generate
```

## Run

From repo root (with dev env):

```bash
pnpm --filter mobile run dev
```

Configure API base URL for the mutator via your Expo env (see `.env_example`).

### Google sign-in (mobile)

The API validates `redirect_uri` from `expo-linking` before starting OAuth. **Expo Go** uses URLs like `exp://192.168.x.x:8081/--/auth-callback`; the backend allows those automatically (LAN, `127.0.0.1`, `.exp.direct`, `.expo.dev`, etc.). **Release builds** use `techoo://auth-callback` per `app.json` `scheme`. If you still see `Untrusted redirect_uri`, copy the exact URL from a debug log and add it to `MOBILE_REDIRECT_URIS` on the server, or deploy the backend with the latest `mobile-redirect` rules.

## Navigation (two tabs)

| Tab      | Role |
|----------|------|
| **Today** | **Plan** — to-dos for the selected day, week strip, “Next up” when viewing today. **Log** — that day’s posts + sticky composer. Mode is persisted (`AsyncStorage`). |
| **Library** | Calendar, all open to-dos, **Logbook** (last 14 days of posts), Notes, Settings — same screens as before, opened from one list (hidden from the tab bar). |

## Stack notes

- Expo Router, Nativewind, SWR + Orval-generated hooks (`gen/api/`)
- Modal routes: `todo/[id]`, `note/[id]`

Legacy **tasks / timers / tags** UI has been removed in favor of **todos** and **posts**.
