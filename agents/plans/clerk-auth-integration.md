# Clerk Authentication Integration Plan

## Overview

Integrate Clerk authentication into Shuchu using **Clerk JS SDK directly in the Electron renderer**. This approach uses Clerk's official JavaScript SDK for authentication, with the main process only handling deep link forwarding.

**Architecture Decision**: OAuth is handled entirely in the renderer using `@clerk/clerk-js`. The main process only registers the custom protocol and forwards callback URLs to the renderer via IPC. Token management is handled by Clerk SDK internally.

## Implementation Status

- [x] Phase 1: Backend Authentication (JWT verification)
- [x] Phase 2: Electron Clerk SDK Integration
- [x] Phase 3: Renderer OAuth Flow
- [x] Phase 4: API Integration

## Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ELECTRON APP                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                      ┌─────────────────┐       │
│  │   Main Process  │                      │    Renderer     │       │
│  │                 │                      │                 │       │
│  │ • Protocol      │  IPC: callback URL   │ • Clerk JS SDK  │       │
│  │   registration  │─────────────────────>│ • Auth state    │       │
│  │ • URL forwarding│                      │ • Token mgmt    │       │
│  │                 │  IPC: open browser   │                 │       │
│  │ • Open external │<─────────────────────│                 │       │
│  └─────────────────┘                      └─────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
         │                                          │
         │ Opens system browser                     │ API calls with
         ▼                                          │ Bearer token
┌─────────────────┐                                 ▼
│      Clerk      │                        ┌─────────────────┐
│   (OAuth IdP)   │                        │    Backend API  │
│                 │                        │                 │
│ • Google OAuth  │                        │ • JWT verify    │
│ • Session mgmt  │                        │ • User sync     │
└─────────────────┘                        │ • CRUD ops      │
         │                                 └─────────────────┘
         │ shuchu://auth/callback
         ▼
┌─────────────────┐
│  Main Process   │
│  (deep link)    │
└─────────────────┘
```

## OAuth Flow (Renderer-Centric)

```
1. User clicks "Login"
   └─> Renderer: clerk.client.signIn.create({ strategy: 'oauth_google' })

2. Clerk SDK returns authorization URL
   └─> Renderer: window.api.auth.openAuthUrl(url)
   └─> Main: shell.openExternal(url)

3. User authenticates in browser
   └─> Clerk redirects to shuchu://auth/callback

4. OS launches app with deep link
   └─> Main: handleOAuthCallback(url)
   └─> Main: mainWindow.webContents.send('auth:callback-url', url)

5. Renderer receives callback
   └─> Renderer: clerk.handleRedirectCallback({ redirectUrl: url })
   └─> Clerk SDK establishes session

6. API calls use Clerk session token
   └─> Renderer: await clerk.session.getToken()
   └─> Backend: verifyToken() with @clerk/backend
```

---

## Phase 1: Backend Authentication

### 1.1 Database Schema

**File**: `apps/web/app/db/schema/schema.ts`

Provider-agnostic auth tables:

```typescript
// Users table - provider agnostic
export const usersTable = sqliteTable('users', {
  id: blob('id').primaryKey().$type<string>(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
});

// Auth providers table - links external identity providers to users
export const userAuthProvidersTable = sqliteTable('user_auth_providers', {
  id: blob('id').primaryKey().$type<string>(),
  userId: blob('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).$type<string>(),
  provider: text('provider').notNull(),       // 'clerk', 'google', etc.
  providerId: text('provider_id').notNull(),  // External ID from provider
  email: text('email'),
  providerData: text('provider_data'),        // JSON with additional data
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueProviderUser: unique().on(table.provider, table.providerId),
}));
```

### 1.2 Dependencies

```bash
pnpm --filter web add @clerk/backend
```

Using `@clerk/backend` for JWT verification - provides `verifyToken()` function.

### 1.3 Auth Middleware

**File**: `apps/web/app/api/[[...route]]/middleware/auth.ts`

```typescript
import { verifyToken } from '@clerk/backend'
import { createMiddleware } from 'hono/factory'

export interface AuthContext {
  userId: string    // Clerk user ID from 'sub' claim
  sessionId?: string
  email?: string
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })

    c.set('auth', {
      userId: payload.sub,
      sessionId: payload.sid,
      email: (payload as { email?: string }).email,
    })

    await next()
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})
```

### 1.4 User Sync Service

**File**: `apps/web/app/core/auth.db.ts`

```typescript
export async function findOrCreateUserByProvider(
  db: DB,
  providerInfo: AuthProviderInfo
): Promise<SelectUser> {
  // 1. Look up user_auth_providers by (provider, providerId)
  // 2. If found, return linked user
  // 3. If not found, create user + auth provider link
}
```

---

## Phase 2: Electron Clerk SDK Integration

### 2.1 Dependencies

```bash
pnpm --filter electron add @clerk/clerk-js
```

### 2.2 Clerk Initialization

**File**: `apps/electron/src/renderer/src/lib/clerk.ts`

```typescript
import { Clerk } from '@clerk/clerk-js'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required')
}

export const clerk = new Clerk(publishableKey)

let initialized = false
let initPromise: Promise<void> | null = null

export async function initClerk(): Promise<void> {
  if (initialized) return
  if (initPromise) return initPromise

  initPromise = clerk.load().then(() => {
    initialized = true
  })

  return initPromise
}

export function isAuthenticated(): boolean {
  return initialized && clerk.session !== null && clerk.session !== undefined
}

export async function getSessionToken(): Promise<string | null> {
  if (!initialized || !clerk.session) return null
  return await clerk.session.getToken()
}

export async function signOut(): Promise<void> {
  if (!initialized || !clerk.session) return
  await clerk.signOut()
}

export function onSessionChange(callback: (session: typeof clerk.session) => void): () => void {
  return clerk.addListener((resources) => {
    callback(resources.session)
  })
}
```

### 2.3 Preload Script

**File**: `apps/electron/src/preload/index.ts`

```typescript
const api = {
  auth: {
    // Open OAuth URL in system browser
    openAuthUrl: (url: string): Promise<void> => ipcRenderer.invoke('auth:open-url', url),
    // Listen for OAuth callback URL from main process
    onCallbackUrl: (callback: (url: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, url: string): void => {
        callback(url)
      }
      ipcRenderer.on('auth:callback-url', handler)
      return () => ipcRenderer.removeListener('auth:callback-url', handler)
    }
  },
  // ... other APIs
}
```

### 2.4 Main Process Auth

**File**: `apps/electron/src/main/auth/authFlow.ts`

Simplified to only forward URLs:

```typescript
import { shell, app, BrowserWindow } from 'electron'

const PROTOCOL = 'shuchu'
const CALLBACK_PATH = 'auth/callback'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window
}

export function registerProtocolHandler(): void {
  if (process.defaultApp) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [process.argv[1]])
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

export async function handleOAuthCallback(url: string): Promise<boolean> {
  if (!url.startsWith(`${PROTOCOL}://${CALLBACK_PATH}`)) {
    return false
  }

  // Forward callback URL to renderer for Clerk SDK to process
  mainWindow?.webContents.send('auth:callback-url', url)
  return true
}

export async function openAuthUrl(url: string): Promise<void> {
  await shell.openExternal(url)
}
```

### 2.5 Main Process IPC

**File**: `apps/electron/src/main/index.ts`

```typescript
import { registerProtocolHandler, handleOAuthCallback, setMainWindow, openAuthUrl } from './auth/authFlow'

// Register protocol before app is ready
registerProtocolHandler()

app.whenReady().then(() => {
  // IPC handler for opening OAuth URL
  ipcMain.handle('auth:open-url', async (_event, url: string) => {
    await openAuthUrl(url)
  })

  createWindow()
  setMainWindow(mainWindow)

  // ... other initialization
})

// Handle OAuth callback via deep link (macOS)
app.on('open-url', async (event, url) => {
  event.preventDefault()
  await handleOAuthCallback(url)
})

// Handle OAuth callback via deep link (Windows/Linux)
app.on('second-instance', async (_event, argv) => {
  const url = argv.find(arg => arg.startsWith('shuchu://'))
  if (url) await handleOAuthCallback(url)
})
```

---

## Phase 3: Renderer OAuth Flow

### 3.1 Auth Context

**File**: `apps/electron/src/renderer/src/contexts/AuthContext.tsx`

```typescript
import { clerk, initClerk, isAuthenticated as checkClerkAuth, signOut as clerkSignOut, onSessionChange } from '../lib/clerk'

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize Clerk on mount
  useEffect(() => {
    initClerk()
      .then(() => setIsAuthenticated(checkClerkAuth()))
      .finally(() => setIsLoading(false))
  }, [])

  // Listen for session changes
  useEffect(() => {
    return onSessionChange((session) => {
      setIsAuthenticated(session !== null && session !== undefined)
    })
  }, [])

  // Listen for OAuth callback from main process
  useEffect(() => {
    return window.api.auth.onCallbackUrl(async (url) => {
      setIsLoading(true)
      await clerk.handleRedirectCallback({ redirectUrl: url })
      setIsAuthenticated(checkClerkAuth())
      setIsLoading(false)
    })
  }, [])

  const login = useCallback(async () => {
    setIsLoading(true)
    const signIn = clerk.client?.signIn
    if (!signIn) throw new Error('Clerk client not available')

    const result = await signIn.create({
      strategy: 'oauth_google',
      redirectUrl: 'shuchu://auth/callback',
      actionCompleteRedirectUrl: 'shuchu://auth/callback'
    })

    if (result.firstFactorVerification.externalVerificationRedirectURL) {
      await window.api.auth.openAuthUrl(
        result.firstFactorVerification.externalVerificationRedirectURL.toString()
      )
    }
  }, [])

  const logout = useCallback(async () => {
    await clerkSignOut()
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## Phase 4: API Integration

### 4.1 HTTP Client

**File**: `apps/electron/src/renderer/src/lib/api/mutator.ts`

```typescript
import { getSessionToken } from '../clerk'

export const customInstance = async <T>(config: CustomRequestConfig): Promise<T> => {
  // Get token from Clerk session (not IPC)
  const token = await getSessionToken()

  const response = await fetch(url.toString(), {
    method: config.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...config.headers,
    },
    body: config.data ? JSON.stringify(config.data) : undefined,
  })

  if (response.status === 401) {
    notifyAuthRequired()
  }

  return response.json()
}
```

---

## Environment Variables

### Web App (`apps/web/.env.local`)
```bash
CLERK_SECRET_KEY=sk_test_xxx
```

### Electron App (`apps/electron/.env`)
```bash
VITE_API_URL=http://localhost:3000/api
MAIN_VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### Clerk Dashboard Configuration
- Add `shuchu://auth/callback` to allowed redirect URLs

---

## Critical Files

| File | Description |
|------|-------------|
| `apps/web/app/db/schema/schema.ts` | User and auth provider tables |
| `apps/web/app/api/[[...route]]/middleware/auth.ts` | JWT verification with @clerk/backend |
| `apps/web/app/core/auth.db.ts` | User sync with race condition handling |
| `apps/electron/src/renderer/src/lib/clerk.ts` | Clerk SDK initialization and helpers |
| `apps/electron/src/renderer/src/contexts/AuthContext.tsx` | Auth state management with Clerk |
| `apps/electron/src/main/auth/authFlow.ts` | Protocol registration and URL forwarding |
| `apps/electron/src/preload/index.ts` | IPC bridge for auth |
| `apps/electron/src/renderer/src/lib/api/mutator.ts` | HTTP client with Clerk tokens |

---

## Verification Steps

1. **Clerk initialization**:
   - App starts without errors
   - Clerk loads with publishableKey

2. **Login flow**:
   ```
   Click login → opens browser → authenticate → redirects to shuchu://auth/callback
   → App receives callback → Clerk processes → session established
   ```

3. **API calls**:
   - Authenticated API calls work
   - Token automatically retrieved from Clerk session

4. **Logout**:
   - Session cleared properly
   - Redirected to login screen

5. **Type safety**:
   ```bash
   pnpm run check-types
   ```

---

## Security Considerations

- **Publishable key**: Safe to expose in client (public key)
- **PKCE**: Handled internally by Clerk SDK
- **Token storage**: Managed by Clerk SDK (uses secure browser storage)
- **JWT verification**: Backend verifies tokens with `@clerk/backend`
- **Protocol validation**: Main process only handles `shuchu://auth/callback`

---

## Architecture Comparison

### Previous (Backend-Centric)

```
Electron → GET /api/auth/url → Backend generates URL → Browser → Callback
        → POST /api/auth/token → Backend exchanges code → Returns tokens
        → Electron stores tokens in safeStorage
```

### Current (Renderer-Centric)

```
Electron Renderer → Clerk SDK creates sign-in → Browser → Callback
                 → Main forwards URL via IPC → Renderer handles with Clerk SDK
                 → Clerk SDK manages session internally
```

### Benefits of Renderer-Centric

| Aspect | Backend-Centric | Renderer-Centric |
|--------|-----------------|------------------|
| Token management | Custom (safeStorage) | Clerk SDK (automatic) |
| Token refresh | Manual implementation | Automatic by Clerk |
| Session state | Manual sync | Clerk SDK listeners |
| Backend code | OAuth endpoints needed | Just JWT verification |
| Error handling | Manual | Clerk SDK handles |

---

## User Creation Flow

User creation happens on the **backend** during the first authenticated API call:

```
1. User authenticates with Clerk (via SDK in renderer)
2. Clerk SDK returns session token
3. First API call sends token in Authorization header
4. Backend middleware verifies token with @clerk/backend
5. Handler calls findOrCreateUserByProvider():
   - Looks up by (provider='clerk', providerId=clerkUserId)
   - If not found → creates new user + auth provider link
   - If found → returns existing user
```

---

## References

- [Clerk JavaScript SDK](https://clerk.com/docs/references/javascript/clerk/clerk)
- [@clerk/backend](https://clerk.com/docs/references/backend/overview)
- [Electron Deep Links](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app)
