# Clerk Authentication Integration Plan

## Overview

Integrate Clerk authentication into Shuchu using **Clerk as an OIDC Identity Provider**. This approach uses standard OAuth 2.0 / OpenID Connect protocols, which are well-documented and supported for desktop applications.

**Key Insight**: Clerk doesn't have an official Electron SDK, but it can act as a standard OIDC Identity Provider. We'll use the Authorization Code flow with PKCE, which is the recommended approach for public clients (desktop apps).

## Authentication Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Electron   │────>│   Browser   │────>│   Clerk     │
│    App      │     │  (System)   │     │   (IdP)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │<──────── shuchu://callback ───────────│
       │         (auth code + state)           │
       │                                       │
       │────── Token Exchange (PKCE) ─────────>│
       │<────── ID Token + Access Token ───────│
       │        + Refresh Token                │
       │                                       │
       ▼                                       │
┌─────────────┐                                │
│  Backend    │<── Verify ID Token (JWKS) ─────│
│    API      │                                │
└─────────────┘
```

## Token Types (from Clerk OIDC)

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Authorization Code | 10 minutes | Exchange for tokens (one-time use) |
| ID Token | Short-lived | JWT for backend verification (contains user info) |
| Access Token | 2 hours | Access Clerk's userinfo endpoint |
| Refresh Token | 3 days | Get new access/ID tokens |

**Important**: The ID Token is a standard JWT verified using Clerk's JWKS endpoint, NOT a Clerk session token.

Reference: [Clerk as Identity Provider](https://clerk.com/docs/advanced-usage/clerk-idp)

---

## Phase 1: Clerk Dashboard Setup

### 1.1 Create Clerk Application

1. Go to [clerk.com/dashboard](https://clerk.com/dashboard)
2. Create a new application
3. Configure authentication methods (Google, GitHub, email, etc.)

### 1.2 Create OAuth Application (Clerk as IdP)

1. Navigate to **Configure > SSO Connections > Create connection**
2. Select **"Add OAuth application"** (for Clerk to act as IdP)
3. Configure:
   - **Name**: "Shuchu Desktop"
   - **Redirect URI**: `shuchu://auth/callback`
   - **Scopes**: `openid profile email`
4. Note down:
   - **Client ID**: `oauth_app_xxxxx`
   - **Client Secret**: For token exchange (store securely in backend)
   - **Discovery URL**: `https://{your-domain}.clerk.accounts.dev/.well-known/openid-configuration`

### 1.3 Clerk OIDC Endpoints

| Endpoint | URL |
|----------|-----|
| Authorization | `https://{domain}.clerk.accounts.dev/oauth/authorize` |
| Token | `https://{domain}.clerk.accounts.dev/oauth/token` |
| UserInfo | `https://{domain}.clerk.accounts.dev/oauth/userinfo` |
| JWKS | `https://{domain}.clerk.accounts.dev/.well-known/jwks.json` |

---

## Phase 2: Backend Authentication

### 2.1 Database Schema Changes

This design keeps the `usersTable` provider-agnostic by using a separate `authIdentitiesTable` to link external identity providers to users. Benefits:
- Users table stays clean (no auth-specific fields)
- Support multiple auth providers in the future
- Users can link multiple identities (Google, GitHub, etc.)
- Easy to swap/add auth providers without schema changes to users

**File**: `apps/web/app/db/schema/schema.ts`

```typescript
import { sqliteTable, text, integer, blob, index, unique } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Users table remains provider-agnostic
export const usersTable = sqliteTable('users', {
  id: blob('id').primaryKey().$type<string>(),
  name: text('name').notNull(),
  email: text('email'),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('users_email_idx').on(table.email),
])

// Auth identities table - links external identity providers to users
export const authIdentitiesTable = sqliteTable('auth_identities', {
  id: blob('id').primaryKey().$type<string>(),
  userId: blob('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).$type<string>(),
  provider: text('provider').notNull(), // 'clerk', 'google', 'github', etc.
  providerUserId: text('provider_user_id').notNull(), // External ID from provider
  email: text('email'), // Email from this identity (may differ per provider)
  metadata: text('metadata', { mode: 'json' }), // Additional provider-specific data
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  // Each provider + providerUserId pair must be unique
  unique('auth_identities_provider_user').on(table.provider, table.providerUserId),
  // Index for fast lookups
  index('auth_identities_user_id_idx').on(table.userId),
  index('auth_identities_provider_lookup_idx').on(table.provider, table.providerUserId),
])

// Type exports
export type InsertAuthIdentity = typeof authIdentitiesTable.$inferInsert
export type SelectAuthIdentity = typeof authIdentitiesTable.$inferSelect
```

**Migration SQL** (`drizzle/migrations/XXXX_auth_identities.sql`):
```sql
-- Add timestamps to users table (if not present)
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN image_url TEXT;
ALTER TABLE users ADD COLUMN created_at INTEGER NOT NULL DEFAULT (unixepoch());
ALTER TABLE users ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (unixepoch());

-- Create auth_identities table
CREATE TABLE IF NOT EXISTS auth_identities (
  id BLOB PRIMARY KEY,
  user_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(provider, provider_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx ON auth_identities(user_id);
CREATE INDEX IF NOT EXISTS auth_identities_provider_lookup_idx ON auth_identities(provider, provider_user_id);

-- Migrate existing default users: create auth identity entries
-- Note: This links existing users to a placeholder identity that will be updated on first login
INSERT INTO auth_identities (id, user_id, provider, provider_user_id, created_at, updated_at)
SELECT
  randomblob(16) as id,
  id as user_id,
  'migration_pending' as provider,
  'user_' || hex(id) as provider_user_id,
  unixepoch() as created_at,
  unixepoch() as updated_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM auth_identities WHERE auth_identities.user_id = users.id
);
```

### 2.2 Install Dependencies

```bash
pnpm --filter web add jose
```

Using `jose` (JavaScript Object Signing and Encryption) for standard JWT/JWKS verification instead of Clerk-specific SDK.

### 2.3 JWKS-based Token Verification

**New file**: `apps/web/app/api/[[...route]]/middleware/auth.ts`

```typescript
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { Context, Next } from 'hono'

// Clerk OIDC configuration
const CLERK_DOMAIN = process.env.CLERK_DOMAIN! // e.g., 'your-app.clerk.accounts.dev'
const CLERK_OAUTH_CLIENT_ID = process.env.CLERK_OAUTH_CLIENT_ID! // OAuth app client ID

// JWKS endpoint for ID token verification
const JWKS_URL = new URL(`https://${CLERK_DOMAIN}/.well-known/jwks.json`)
const jwks = createRemoteJWKSet(JWKS_URL)

export interface AuthContext {
  clerkUserId: string  // 'sub' claim from ID token
  email?: string
  name?: string
  picture?: string
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

/**
 * Verify Clerk OIDC ID Token using JWKS.
 *
 * This follows standard OIDC ID token verification:
 * - Validates RS256 signature using Clerk's JWKS
 * - Checks exp, nbf, iat claims
 * - Verifies iss (issuer) matches Clerk domain
 * - Verifies aud (audience) matches OAuth Client ID
 *
 * Reference: https://clerk.com/docs/advanced-usage/clerk-idp
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header'
    }, 401)
  }

  const idToken = authHeader.substring(7)

  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: `https://${CLERK_DOMAIN}`,
      audience: CLERK_OAUTH_CLIENT_ID,
      algorithms: ['RS256'],
      // Allow 10 seconds clock skew
      clockTolerance: 10,
    })

    // Validate required claims
    if (!payload.sub) {
      throw new Error('Missing subject (sub) claim')
    }

    c.set('auth', {
      clerkUserId: payload.sub,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
    })

    await next()
  } catch (error) {
    console.error('ID token verification failed:', error)

    const message = error instanceof Error ? error.message : 'Token verification failed'
    return c.json({
      error: 'Unauthorized',
      message,
      hint: 'Ensure ID token is valid, not expired, and issued by Clerk'
    }, 401)
  }
}
```

### 2.4 User Sync Service with Caching

**New file**: `apps/web/app/core/auth.db.ts`

```typescript
import { eq, and } from 'drizzle-orm'
import { usersTable, authIdentitiesTable, type SelectUser, type SelectAuthIdentity } from '../db/schema/schema'
import { createId, type DB } from './common.db'
import { getCurrentUnixTimestamp } from './common.core'

const AUTH_PROVIDER_CLERK = 'clerk'

export interface ProviderUserInfo {
  providerUserId: string  // External ID from provider (e.g., Clerk user ID)
  provider?: string       // Defaults to 'clerk'
  email?: string | null
  name?: string | null
  picture?: string | null
}

// In-memory cache (TTL: 5 minutes)
// Key: `${provider}:${providerUserId}`
const userCache = new Map<string, { user: SelectUser; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

function getCacheKey(provider: string, providerUserId: string): string {
  return `${provider}:${providerUserId}`
}

/**
 * Find or create user by external identity provider.
 *
 * Flow:
 * 1. Look up auth_identities by provider + provider_user_id
 * 2. If found, return the linked user (update profile if needed)
 * 3. If not found, create new user AND auth_identity linking them
 *
 * This keeps the users table provider-agnostic.
 */
export async function findOrCreateUserByProvider(
  db: DB,
  info: ProviderUserInfo
): Promise<SelectUser> {
  const provider = info.provider || AUTH_PROVIDER_CLERK
  const cacheKey = getCacheKey(provider, info.providerUserId)
  const now = Date.now()

  // Check cache
  const cached = userCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.user
  }

  // Find existing auth identity
  const [existingIdentity] = await db
    .select()
    .from(authIdentitiesTable)
    .where(
      and(
        eq(authIdentitiesTable.provider, provider),
        eq(authIdentitiesTable.providerUserId, info.providerUserId)
      )
    )
    .limit(1)

  if (existingIdentity) {
    // Get the linked user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, existingIdentity.userId))
      .limit(1)

    if (user) {
      // Update user profile if info has changed
      if (profileNeedsUpdate(user, info)) {
        const timestamp = getCurrentUnixTimestamp()
        await db
          .update(usersTable)
          .set({
            email: info.email ?? user.email,
            name: info.name || user.name,
            imageUrl: info.picture ?? user.imageUrl,
            updatedAt: timestamp,
          })
          .where(eq(usersTable.id, user.id))

        // Refetch updated user
        const [updated] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, user.id))
          .limit(1)

        if (updated) {
          userCache.set(cacheKey, { user: updated, expiresAt: now + CACHE_TTL_MS })
          return updated
        }
      }

      userCache.set(cacheKey, { user, expiresAt: now + CACHE_TTL_MS })
      return user
    }
  }

  // Create new user and auth identity
  // Use transaction to ensure both are created together
  const timestamp = getCurrentUnixTimestamp()

  try {
    const userId = createId()

    // Create user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        id: userId,
        name: info.name || 'User',
        email: info.email ?? null,
        imageUrl: info.picture ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning()

    if (!newUser) {
      throw new Error('Failed to create user')
    }

    // Create auth identity linking provider to user
    await db
      .insert(authIdentitiesTable)
      .values({
        id: createId(),
        userId: newUser.id,
        provider,
        providerUserId: info.providerUserId,
        email: info.email ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

    userCache.set(cacheKey, { user: newUser, expiresAt: now + CACHE_TTL_MS })
    return newUser
  } catch (error) {
    // Handle race condition: another request may have created the identity
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      // Retry the lookup
      const [raceIdentity] = await db
        .select()
        .from(authIdentitiesTable)
        .where(
          and(
            eq(authIdentitiesTable.provider, provider),
            eq(authIdentitiesTable.providerUserId, info.providerUserId)
          )
        )
        .limit(1)

      if (raceIdentity) {
        const [raceUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, raceIdentity.userId))
          .limit(1)

        if (raceUser) {
          userCache.set(cacheKey, { user: raceUser, expiresAt: now + CACHE_TTL_MS })
          return raceUser
        }
      }
    }
    throw error
  }
}

/**
 * Get all auth identities for a user.
 * Useful for account settings / linked accounts display.
 */
export async function getUserAuthIdentities(
  db: DB,
  userId: string
): Promise<SelectAuthIdentity[]> {
  return db
    .select()
    .from(authIdentitiesTable)
    .where(eq(authIdentitiesTable.userId, userId))
}

/**
 * Link an additional identity to an existing user.
 * Used when user wants to add another sign-in method.
 */
export async function linkAuthIdentity(
  db: DB,
  userId: string,
  info: ProviderUserInfo
): Promise<SelectAuthIdentity> {
  const provider = info.provider || AUTH_PROVIDER_CLERK
  const timestamp = getCurrentUnixTimestamp()

  const [identity] = await db
    .insert(authIdentitiesTable)
    .values({
      id: createId(),
      userId,
      provider,
      providerUserId: info.providerUserId,
      email: info.email ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()

  if (!identity) {
    throw new Error('Failed to link auth identity')
  }

  return identity
}

/**
 * Unlink an auth identity from a user.
 * Prevents unlinking the last identity (user would be orphaned).
 */
export async function unlinkAuthIdentity(
  db: DB,
  userId: string,
  identityId: string
): Promise<void> {
  // Check user has more than one identity
  const identities = await getUserAuthIdentities(db, userId)
  if (identities.length <= 1) {
    throw new Error('Cannot unlink the only auth identity')
  }

  await db
    .delete(authIdentitiesTable)
    .where(
      and(
        eq(authIdentitiesTable.id, identityId),
        eq(authIdentitiesTable.userId, userId)
      )
    )
}

function profileNeedsUpdate(existing: SelectUser, info: ProviderUserInfo): boolean {
  return (
    (info.email != null && existing.email !== info.email) ||
    (info.name != null && existing.name !== info.name) ||
    (info.picture != null && existing.imageUrl !== info.picture)
  )
}

export function invalidateUserCache(provider: string, providerUserId: string): void {
  userCache.delete(getCacheKey(provider, providerUserId))
}
```

### 2.5 Update API Route Configuration

**File**: `apps/web/app/api/[[...route]]/route.ts`

```typescript
import { OpenAPIHono } from '@hono/zod-openapi'
import { handle } from 'hono/vercel'
import { authMiddleware } from './middleware/auth'
// ... other imports ...

const app = new OpenAPIHono().basePath('/api')

// CORS middleware - handle Electron's null origin
app.use('/*', async (c, next) => {
  const origin = c.req.header('Origin')

  // Electron sends null or no origin - allow specific patterns
  // In production, maintain an allowlist
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    // Add production domains here
  ]

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Credentials', 'true')
  } else if (!origin) {
    // Electron with null origin - allow without credentials
    c.header('Access-Control-Allow-Origin', '*')
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200)
  }

  await next()
})

// Public routes
app.openapi(healthRoute, healthHandler)

// Apply auth middleware to protected routes
app.use('/tasks/*', authMiddleware)
app.use('/timers/*', authMiddleware)
app.use('/tags/*', authMiddleware)
app.use('/comments/*', authMiddleware)
app.use('/activities/*', authMiddleware)

// Protected routes
app.openapi(listTasksRoute, listTasksHandler)
// ... rest of routes ...

// OpenAPI documentation with security schema
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Shuchu API',
    description: 'Task management API with Clerk OIDC authentication'
  },
  components: {
    securitySchemes: {
      ClerkOIDC: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk OIDC ID Token (obtained via OAuth 2.0 Authorization Code flow with PKCE)'
      }
    }
  },
  security: [{ ClerkOIDC: [] }]
})
```

### 2.6 Update Handler Pattern

**Example**: `apps/web/app/api/[[...route]]/handlers/tasks.ts`

```typescript
import { findOrCreateUserByProvider } from '../../../core/auth.db'

export const listTasksHandler: RouteHandler<typeof listTasksRoute> = async (c) => {
  try {
    const db = getDb()
    const auth = c.get('auth')

    // Find or create user via auth identity lookup
    const user = await findOrCreateUserByProvider(db, {
      provider: 'clerk',
      providerUserId: auth.clerkUserId,
      email: auth.email,
      name: auth.name,
      picture: auth.picture,
    })

    const filters = c.req.valid('query')
    const tasks = await getAllTasks(db, user.id.toString(), filters)

    return c.json({ tasks, total: tasks.length }, 200)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
```

---

## Phase 3: Electron OAuth Flow (PKCE)

### 3.1 Platform Support Matrix

| Platform | Deep Link Handling | Token Storage |
|----------|-------------------|---------------|
| macOS | `open-url` event + protocol handler | Keychain via keytar |
| Windows | `second-instance` event + argv parsing | Credential Manager via keytar |
| Linux | Requires `.desktop` file registration | Secret Service via keytar (if available) |

### 3.2 Install Dependencies

```bash
pnpm --filter electron add keytar electron-store
```

- `keytar`: Native module for OS credential storage (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- `electron-store`: Fallback encrypted storage

### 3.3 PKCE Utilities

**New file**: `apps/electron/src/main/auth/pkce.ts`

```typescript
import * as crypto from 'crypto'

/**
 * Generate PKCE code verifier and challenge.
 * Reference: RFC 7636
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate 32 random bytes (256 bits) for code verifier
  const codeVerifier = crypto.randomBytes(32)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 128)

  // SHA-256 hash of code verifier, base64url encoded
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { codeVerifier, codeChallenge }
}

/**
 * Generate random state parameter for CSRF protection.
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex')
}
```

### 3.4 Token Storage Service

**New file**: `apps/electron/src/main/auth/tokenStorage.ts`

```typescript
import * as keytar from 'keytar'
import Store from 'electron-store'
import { safeStorage } from 'electron'

const SERVICE_NAME = 'shuchu-app'
const ACCOUNT_ID_TOKEN = 'clerk-id-token'
const ACCOUNT_REFRESH_TOKEN = 'clerk-refresh-token'
const ACCOUNT_TOKEN_METADATA = 'clerk-token-metadata'

interface TokenMetadata {
  idTokenExpiresAt: number   // Unix timestamp (ms)
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

// Fallback store for systems without keychain
const fallbackStore = new Store<{ tokens?: string }>({
  name: 'shuchu-auth',
  encryptionKey: process.env.ELECTRON_STORE_KEY || 'shuchu-fallback-key',
})

let keytarAvailable: boolean | null = null

async function isKeytarAvailable(): Promise<boolean> {
  if (keytarAvailable !== null) return keytarAvailable

  try {
    // Test keytar availability
    await keytar.findCredentials(SERVICE_NAME)
    keytarAvailable = true
  } catch {
    console.warn('Keytar not available, using fallback storage')
    keytarAvailable = false
  }

  return keytarAvailable
}

/**
 * Secure token storage with OS keychain (preferred) or encrypted fallback.
 *
 * Storage priority:
 * 1. keytar (macOS Keychain, Windows Credential Manager, Linux Secret Service)
 * 2. Electron safeStorage + electron-store (fallback)
 *
 * Note: On Linux without a keyring, tokens will be stored with electron-store
 * encryption only. Users should be warned about reduced security.
 */
export const tokenStorage = {
  async setTokens(params: {
    idToken: string
    accessToken: string
    refreshToken: string
    idTokenExpiresAt: number
    accessTokenExpiresAt: number
    refreshTokenExpiresAt: number
  }): Promise<void> {
    const metadata: TokenMetadata = {
      idTokenExpiresAt: params.idTokenExpiresAt,
      accessTokenExpiresAt: params.accessTokenExpiresAt,
      refreshTokenExpiresAt: params.refreshTokenExpiresAt,
    }

    if (await isKeytarAvailable()) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_ID_TOKEN, params.idToken)
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_REFRESH_TOKEN, params.refreshToken)
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_TOKEN_METADATA, JSON.stringify(metadata))
    } else {
      // Fallback: use safeStorage if available
      const tokenData = JSON.stringify({
        idToken: params.idToken,
        refreshToken: params.refreshToken,
        metadata,
      })

      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(tokenData)
        fallbackStore.set('tokens', encrypted.toString('base64'))
      } else {
        // Last resort - warn user
        console.error('WARNING: No secure storage available. Tokens stored with basic encryption.')
        fallbackStore.set('tokens', Buffer.from(tokenData).toString('base64'))
      }
    }
  },

  async getIdToken(): Promise<string | null> {
    if (await isKeytarAvailable()) {
      return keytar.getPassword(SERVICE_NAME, ACCOUNT_ID_TOKEN)
    }

    const stored = fallbackStore.get('tokens')
    if (!stored) return null

    try {
      let tokenData: string
      if (safeStorage.isEncryptionAvailable()) {
        tokenData = safeStorage.decryptString(Buffer.from(stored, 'base64'))
      } else {
        tokenData = Buffer.from(stored, 'base64').toString()
      }
      return JSON.parse(tokenData).idToken
    } catch {
      return null
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (await isKeytarAvailable()) {
      return keytar.getPassword(SERVICE_NAME, ACCOUNT_REFRESH_TOKEN)
    }

    const stored = fallbackStore.get('tokens')
    if (!stored) return null

    try {
      let tokenData: string
      if (safeStorage.isEncryptionAvailable()) {
        tokenData = safeStorage.decryptString(Buffer.from(stored, 'base64'))
      } else {
        tokenData = Buffer.from(stored, 'base64').toString()
      }
      return JSON.parse(tokenData).refreshToken
    } catch {
      return null
    }
  },

  async getMetadata(): Promise<TokenMetadata | null> {
    if (await isKeytarAvailable()) {
      const metadataStr = await keytar.getPassword(SERVICE_NAME, ACCOUNT_TOKEN_METADATA)
      return metadataStr ? JSON.parse(metadataStr) : null
    }

    const stored = fallbackStore.get('tokens')
    if (!stored) return null

    try {
      let tokenData: string
      if (safeStorage.isEncryptionAvailable()) {
        tokenData = safeStorage.decryptString(Buffer.from(stored, 'base64'))
      } else {
        tokenData = Buffer.from(stored, 'base64').toString()
      }
      return JSON.parse(tokenData).metadata
    } catch {
      return null
    }
  },

  async clearTokens(): Promise<void> {
    if (await isKeytarAvailable()) {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_ID_TOKEN).catch(() => {})
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_REFRESH_TOKEN).catch(() => {})
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_TOKEN_METADATA).catch(() => {})
    }
    fallbackStore.delete('tokens')
  },

  async isIdTokenExpired(): Promise<boolean> {
    const metadata = await this.getMetadata()
    if (!metadata) return true
    // 60 second buffer
    return Date.now() >= metadata.idTokenExpiresAt - 60000
  },

  async isRefreshTokenExpired(): Promise<boolean> {
    const metadata = await this.getMetadata()
    if (!metadata) return true
    return Date.now() >= metadata.refreshTokenExpiresAt
  },
}
```

### 3.5 OAuth Flow Manager

**New file**: `apps/electron/src/main/auth/authFlow.ts`

```typescript
import { shell, app, BrowserWindow } from 'electron'
import { tokenStorage } from './tokenStorage'
import { generatePKCE, generateState } from './pkce'

// Configuration
const CLERK_DOMAIN = import.meta.env.MAIN_VITE_CLERK_DOMAIN || ''
const CLERK_OAUTH_CLIENT_ID = import.meta.env.MAIN_VITE_CLERK_OAUTH_CLIENT_ID || ''
const CLERK_OAUTH_CLIENT_SECRET = import.meta.env.MAIN_VITE_CLERK_OAUTH_CLIENT_SECRET || ''
const CUSTOM_PROTOCOL = 'shuchu'
const REDIRECT_URI = `${CUSTOM_PROTOCOL}://auth/callback`

// OIDC endpoints
const AUTHORIZE_URL = `https://${CLERK_DOMAIN}/oauth/authorize`
const TOKEN_URL = `https://${CLERK_DOMAIN}/oauth/token`

// State for PKCE flow
let pendingAuth: {
  state: string
  codeVerifier: string
  resolve: (success: boolean) => void
  reject: (error: Error) => void
} | null = null

// Auth state change callback
let authStateCallback: ((isAuthenticated: boolean) => void) | null = null

export const authFlow = {
  setAuthStateCallback(callback: (isAuthenticated: boolean) => void): void {
    authStateCallback = callback
  },

  /**
   * Handle OAuth callback URL.
   * Called when app receives shuchu://auth/callback
   */
  async handleCallback(url: URL): Promise<void> {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    if (error) {
      console.error('OAuth error:', error, errorDescription)
      pendingAuth?.reject(new Error(errorDescription || error))
      pendingAuth = null
      authStateCallback?.(false)
      return
    }

    if (!code || !state) {
      console.error('Missing code or state in callback')
      pendingAuth?.reject(new Error('Missing authorization code or state'))
      pendingAuth = null
      authStateCallback?.(false)
      return
    }

    // Validate state matches
    if (!pendingAuth || pendingAuth.state !== state) {
      console.error('State mismatch - possible CSRF attack')
      pendingAuth?.reject(new Error('State mismatch'))
      pendingAuth = null
      authStateCallback?.(false)
      return
    }

    try {
      // Exchange code for tokens
      await this.exchangeCodeForTokens(code, pendingAuth.codeVerifier)
      pendingAuth.resolve(true)
      pendingAuth = null
      authStateCallback?.(true)
    } catch (err) {
      console.error('Token exchange failed:', err)
      pendingAuth?.reject(err instanceof Error ? err : new Error('Token exchange failed'))
      pendingAuth = null
      authStateCallback?.(false)
    }
  },

  /**
   * Exchange authorization code for tokens using PKCE.
   */
  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<void> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLERK_OAUTH_CLIENT_ID,
        client_secret: CLERK_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    // Parse ID token to get expiry
    const idTokenPayload = JSON.parse(
      Buffer.from(data.id_token.split('.')[1], 'base64').toString()
    )

    const now = Date.now()
    await tokenStorage.setTokens({
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idTokenExpiresAt: idTokenPayload.exp * 1000,
      accessTokenExpiresAt: now + (data.expires_in * 1000), // 2 hours
      refreshTokenExpiresAt: now + (3 * 24 * 60 * 60 * 1000), // 3 days
    })
  },

  /**
   * Refresh tokens using refresh token.
   */
  async refreshTokens(): Promise<boolean> {
    const refreshToken = await tokenStorage.getRefreshToken()
    if (!refreshToken) return false

    if (await tokenStorage.isRefreshTokenExpired()) {
      // Refresh token expired, user must re-login
      await tokenStorage.clearTokens()
      return false
    }

    try {
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CLERK_OAUTH_CLIENT_ID,
          client_secret: CLERK_OAUTH_CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
      })

      if (!response.ok) {
        await tokenStorage.clearTokens()
        return false
      }

      const data = await response.json()

      const idTokenPayload = JSON.parse(
        Buffer.from(data.id_token.split('.')[1], 'base64').toString()
      )

      const now = Date.now()
      await tokenStorage.setTokens({
        idToken: data.id_token,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // May not return new refresh token
        idTokenExpiresAt: idTokenPayload.exp * 1000,
        accessTokenExpiresAt: now + (data.expires_in * 1000),
        refreshTokenExpiresAt: now + (3 * 24 * 60 * 60 * 1000),
      })

      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  },

  /**
   * Get current valid ID token (refresh if needed).
   */
  async getIdToken(): Promise<string | null> {
    if (await tokenStorage.isIdTokenExpired()) {
      const refreshed = await this.refreshTokens()
      if (!refreshed) {
        authStateCallback?.(false)
        return null
      }
    }

    return tokenStorage.getIdToken()
  },

  /**
   * Initiate OAuth login flow with PKCE.
   */
  async login(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const { codeVerifier, codeChallenge } = generatePKCE()
      const state = generateState()

      pendingAuth = { state, codeVerifier, resolve, reject }

      const authUrl = new URL(AUTHORIZE_URL)
      authUrl.searchParams.set('client_id', CLERK_OAUTH_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'openid profile email')
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      // Open in system browser
      shell.openExternal(authUrl.toString())
    })
  },

  async logout(): Promise<void> {
    await tokenStorage.clearTokens()
    authStateCallback?.(false)
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getIdToken()
    return token !== null
  },
}
```

### 3.6 Protocol Registration (Cross-Platform)

**File**: `apps/electron/src/main/index.ts` (additions)

```typescript
import { app, ipcMain, protocol, BrowserWindow } from 'electron'
import { authFlow } from './auth/authFlow'
import * as path from 'path'

const CUSTOM_PROTOCOL = 'shuchu'

// ============ Protocol Registration (must be before app.ready) ============

// Register protocol scheme
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(CUSTOM_PROTOCOL, process.execPath, [
      path.resolve(process.argv[1])
    ])
  }
} else {
  app.setAsDefaultProtocolClient(CUSTOM_PROTOCOL)
}

// ============ Single Instance Lock (Windows deep link handling) ============

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // Windows: Handle protocol URL from second instance
  app.on('second-instance', (_event, commandLine) => {
    // Find the protocol URL in command line args
    const url = commandLine.find(arg => arg.startsWith(`${CUSTOM_PROTOCOL}://`))
    if (url) {
      handleProtocolUrl(url)
    }

    // Focus the main window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ============ macOS: Handle protocol URL when app is running ============

app.on('open-url', (event, url) => {
  event.preventDefault()
  handleProtocolUrl(url)
})

// ============ Protocol URL Handler ============

function handleProtocolUrl(url: string): void {
  if (url.startsWith(`${CUSTOM_PROTOCOL}://auth/callback`)) {
    try {
      const parsedUrl = new URL(url)
      authFlow.handleCallback(parsedUrl)
    } catch (error) {
      console.error('Failed to parse protocol URL:', error)
    }
  }
}

// ============ App Ready ============

app.whenReady().then(() => {
  // Handle protocol URLs via custom scheme handler (for in-app navigation)
  protocol.handle(CUSTOM_PROTOCOL, async (request) => {
    handleProtocolUrl(request.url)
    return new Response('', { status: 200 })
  })

  // Auth state change notifications
  authFlow.setAuthStateCallback((isAuthenticated) => {
    mainWindow?.webContents.send('auth:state-changed', isAuthenticated)
  })

  // Auth IPC handlers
  ipcMain.handle('auth:login', async () => {
    try {
      return await authFlow.login()
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  })

  ipcMain.handle('auth:logout', async () => {
    await authFlow.logout()
  })

  ipcMain.handle('auth:get-token', async () => {
    return authFlow.getIdToken()
  })

  ipcMain.handle('auth:is-authenticated', async () => {
    return authFlow.isAuthenticated()
  })

  // ... rest of app initialization ...
})
```

### 3.7 Update Preload Script

**File**: `apps/electron/src/preload/index.ts` (additions)

```typescript
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // ... existing APIs ...

  auth: {
    login: (): Promise<boolean> => ipcRenderer.invoke('auth:login'),
    logout: (): Promise<void> => ipcRenderer.invoke('auth:logout'),
    getToken: (): Promise<string | null> => ipcRenderer.invoke('auth:get-token'),
    isAuthenticated: (): Promise<boolean> => ipcRenderer.invoke('auth:is-authenticated'),
    onAuthStateChange: (callback: (isAuthenticated: boolean) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, isAuthenticated: boolean): void => {
        callback(isAuthenticated)
      }
      ipcRenderer.on('auth:state-changed', handler)
      return () => ipcRenderer.removeListener('auth:state-changed', handler)
    },
  },
}

contextBridge.exposeInMainWorld('api', api)
```

---

## Phase 4: Renderer Integration

### 4.1 Update HTTP Client

**File**: `apps/electron/src/renderer/src/lib/api/mutator.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const MAX_RETRIES = 1
const RETRY_DELAY_MS = 1000

export interface CustomRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  params?: Record<string, string | number | boolean | null | undefined | string[]>
  data?: unknown
  headers?: Record<string, string>
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export const customInstance = async <T>(
  config: CustomRequestConfig,
  retryCount = 0
): Promise<T> => {
  const url = new URL(config.url, API_BASE_URL)

  if (config.params) {
    Object.entries(config.params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (Array.isArray(value)) {
        value.forEach((entry) => url.searchParams.append(key, String(entry)))
        return
      }
      url.searchParams.set(key, String(value))
    })
  }

  // Get ID token from main process
  const idToken = await window.api.auth.getToken()

  if (!idToken) {
    window.dispatchEvent(new CustomEvent('auth:session-expired'))
    throw new AuthError('Not authenticated')
  }

  const response = await fetch(url.toString(), {
    method: config.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      ...config.headers,
    },
    body: config.data ? JSON.stringify(config.data) : undefined,
  })

  if (response.status === 401) {
    if (retryCount < MAX_RETRIES) {
      // Token might have just been refreshed, retry once
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      return customInstance(config, retryCount + 1)
    }

    window.dispatchEvent(new CustomEvent('auth:session-expired'))
    throw new AuthError('Session expired - please log in again')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return (await response.text()) as unknown as T
}

export default customInstance
```

### 4.2 Auth Context Provider

**New file**: `apps/electron/src/renderer/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.api.auth.isAuthenticated().then((authenticated) => {
      setIsAuthenticated(authenticated)
      setIsLoading(false)
    })

    const unsubscribe = window.api.auth.onAuthStateChange((authenticated) => {
      setIsAuthenticated(authenticated)
      setIsLoading(false)
    })

    const handleSessionExpired = () => {
      setIsAuthenticated(false)
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)

    return () => {
      unsubscribe()
      window.removeEventListener('auth:session-expired', handleSessionExpired)
    }
  }, [])

  const login = useCallback(async () => {
    setIsLoading(true)
    try {
      await window.api.auth.login()
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await window.api.auth.logout()
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 4.3 Login Screen & App Integration

(Same as previous version - LoginScreen.tsx and App.tsx wrapping)

---

## Environment Variables

### Web App (`apps/web/.env.local`)
```bash
# Clerk OIDC Configuration
CLERK_DOMAIN=your-app.clerk.accounts.dev
CLERK_OAUTH_CLIENT_ID=oauth_app_xxxxx
```

### Electron App (`apps/electron/.env`)
```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Clerk OIDC Configuration (main process)
MAIN_VITE_CLERK_DOMAIN=your-app.clerk.accounts.dev
MAIN_VITE_CLERK_OAUTH_CLIENT_ID=oauth_app_xxxxx
MAIN_VITE_CLERK_OAUTH_CLIENT_SECRET=sk_xxxxx
```

---

## Data Migration Strategy

**New file**: `apps/web/app/core/migration.db.ts`

```typescript
import { eq, and, sql } from 'drizzle-orm'
import {
  usersTable,
  authIdentitiesTable,
  tasksTable,
  tagsTable,
  taskCommentsTable,
  taskTimersTable,
} from '../db/schema/schema'
import { createId, type DB } from './common.db'
import { getCurrentUnixTimestamp } from './common.core'

/**
 * Find users with pending migration (created before auth was enabled).
 * These users have auth_identities with provider='migration_pending'.
 */
export async function findMigratableUsers(db: DB): Promise<Array<{ userId: string; name: string }>> {
  const pendingIdentities = await db
    .select({
      userId: authIdentitiesTable.userId,
      userName: usersTable.name,
    })
    .from(authIdentitiesTable)
    .innerJoin(usersTable, eq(authIdentitiesTable.userId, usersTable.id))
    .where(eq(authIdentitiesTable.provider, 'migration_pending'))

  return pendingIdentities.map(row => ({
    userId: row.userId.toString(),
    name: row.userName,
  }))
}

/**
 * Link a new auth identity to an existing user and remove migration_pending identity.
 * Called when a pre-existing user signs in with Clerk for the first time.
 */
export async function linkIdentityToExistingUser(
  db: DB,
  existingUserId: string,
  providerInfo: {
    provider: string
    providerUserId: string
    email?: string | null
    name?: string | null
    picture?: string | null
  }
): Promise<void> {
  const timestamp = getCurrentUnixTimestamp()

  // Create the real auth identity
  await db.insert(authIdentitiesTable).values({
    id: createId(),
    userId: existingUserId,
    provider: providerInfo.provider,
    providerUserId: providerInfo.providerUserId,
    email: providerInfo.email ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  // Update user profile with new info
  await db
    .update(usersTable)
    .set({
      name: providerInfo.name || undefined,
      email: providerInfo.email || undefined,
      imageUrl: providerInfo.picture || undefined,
      updatedAt: timestamp,
    })
    .where(eq(usersTable.id, existingUserId))

  // Remove the migration_pending identity
  await db
    .delete(authIdentitiesTable)
    .where(
      and(
        eq(authIdentitiesTable.userId, existingUserId),
        eq(authIdentitiesTable.provider, 'migration_pending')
      )
    )
}

/**
 * Merge data from one user to another (for account linking scenarios).
 * Moves all tasks, tags, comments to the target user and deletes source user.
 */
export async function mergeUserData(
  db: DB,
  fromUserId: string,
  toUserId: string
): Promise<{ tasksCount: number; tagsCount: number; timersCount: number; commentsCount: number }> {
  // Count items to migrate
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, fromUserId))
  const tags = await db.select().from(tagsTable).where(eq(tagsTable.userId, fromUserId))
  const comments = await db.select().from(taskCommentsTable).where(eq(taskCommentsTable.authorId, fromUserId))

  // Count timers via tasks
  const taskIds = tasks.map(t => t.id.toString())
  let timersCount = 0
  if (taskIds.length > 0) {
    const timers = await db
      .select()
      .from(taskTimersTable)
      .where(sql`${taskTimersTable.taskId} IN (${sql.join(taskIds.map(id => sql`${id}`), sql`, `)})`)
    timersCount = timers.length
  }

  // Update ownership
  await db.update(tasksTable).set({ userId: toUserId }).where(eq(tasksTable.userId, fromUserId))
  await db.update(tagsTable).set({ userId: toUserId }).where(eq(tagsTable.userId, fromUserId))
  await db.update(taskCommentsTable).set({ authorId: toUserId }).where(eq(taskCommentsTable.authorId, fromUserId))

  // Move auth identities (except migration_pending which should be removed)
  await db
    .update(authIdentitiesTable)
    .set({ userId: toUserId })
    .where(
      and(
        eq(authIdentitiesTable.userId, fromUserId),
        sql`${authIdentitiesTable.provider} != 'migration_pending'`
      )
    )

  // Delete remaining auth identities for source user
  await db.delete(authIdentitiesTable).where(eq(authIdentitiesTable.userId, fromUserId))

  // Delete source user (cascade should handle remaining references)
  await db.delete(usersTable).where(eq(usersTable.id, fromUserId))

  return {
    tasksCount: tasks.length,
    tagsCount: tags.length,
    timersCount,
    commentsCount: comments.length,
  }
}
```

---

## Critical Files Summary

| File | Changes |
|------|---------|
| `apps/web/app/db/schema/schema.ts` | Add `authIdentitiesTable`, indexes, user timestamps |
| `apps/web/app/api/[[...route]]/route.ts` | Add auth middleware, CORS handling |
| `apps/web/app/api/[[...route]]/middleware/auth.ts` | **NEW**: JWKS-based ID token verification |
| `apps/web/app/core/auth.db.ts` | **NEW**: Provider-based user lookup with caching |
| `apps/web/app/core/migration.db.ts` | **NEW**: Data migration, identity linking |
| `apps/web/app/api/[[...route]]/handlers/*.ts` | Use `findOrCreateUserByProvider()` |
| `apps/electron/src/main/index.ts` | Protocol registration, IPC handlers |
| `apps/electron/src/main/auth/pkce.ts` | **NEW**: PKCE utilities |
| `apps/electron/src/main/auth/tokenStorage.ts` | **NEW**: Secure token storage |
| `apps/electron/src/main/auth/authFlow.ts` | **NEW**: OAuth flow with refresh |
| `apps/electron/src/preload/index.ts` | Expose auth API |
| `apps/electron/src/renderer/src/lib/api/mutator.ts` | Auth headers, retry |
| `apps/electron/src/renderer/src/contexts/AuthContext.tsx` | **NEW**: Auth state |
| `apps/electron/src/renderer/src/components/LoginScreen.tsx` | **NEW**: Login UI |
| `apps/electron/src/renderer/src/App.tsx` | Auth gating |

---

## Verification Steps

1. **Backend Auth**:
   ```bash
   pnpm --filter web run dev:local
   curl http://localhost:3000/api/tasks  # Should return 401
   # Use a valid Clerk ID token to test
   ```

2. **Electron OAuth Flow**:
   - Start app: `pnpm --filter electron run dev`
   - Shows login screen
   - Click login → opens system browser → Clerk sign-in
   - After auth → redirects to `shuchu://auth/callback`
   - App receives callback → exchanges code for tokens
   - App shows main UI

3. **Token Refresh**:
   - Wait for ID token to expire (~short lifetime)
   - Make API request → should auto-refresh using refresh token

4. **Multi-user**:
   - Login as different users, verify data isolation

5. **Type safety**:
   ```bash
   pnpm run check-types
   ```

---

## Platform-Specific Notes

### macOS
- Deep linking works via `open-url` event
- Keychain access requires signing for distribution

### Windows
- Deep linking requires `second-instance` event handling
- Protocol registration via `setAsDefaultProtocolClient`
- May need to handle Windows registry for packaged app

### Linux
- Requires `.desktop` file with `MimeType=x-scheme-handler/shuchu`
- keytar requires libsecret/GNOME Keyring or KWallet
- Fallback to encrypted electron-store if not available

---

## References

- [Clerk as Identity Provider](https://clerk.com/docs/advanced-usage/clerk-idp)
- [OAuth 2.0 PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [jose library](https://github.com/panva/jose)
- [Electron Deep Links](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app)
- [keytar](https://github.com/atom/node-keytar)
