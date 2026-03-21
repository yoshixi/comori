/**
 * Centralized environment variable access.
 *
 * All env var reads go through getEnv() so there is one place to
 * define types, defaults, and the guard for non-Node runtimes.
 */

export interface AppEnv {
  NODE_ENV?: string

  // Authentication
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  JWT_SECRET?: string
  TRUSTED_ORIGINS?: string
  MOBILE_REDIRECT_URIS?: string

  // Google OAuth
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GOOGLE_REDIRECT_URI?: string

  // Centralized DB (Turso)
  TURSO_CONNECTION_URL?: string
  TURSO_AUTH_TOKEN?: string

  // Local dev DB
  SQLITE_URL?: string

  // Multi-tenant (tenanso)
  TURSO_ORG_SLUG?: string
  TURSO_API_TOKEN?: string
  TURSO_GROUP?: string
  TURSO_GROUP_AUTH_TOKEN?: string
  TURSO_TENANT_DB_URL?: string
  TURSO_SEED_DB?: string
  TURSO_API_BASE_URL?: string

  // Webhooks
  WEBHOOK_BASE_URL?: string
}

/**
 * Returns typed env vars from process.env.
 * Safe to call in non-Node runtimes (returns empty object).
 */
export function getEnv(): AppEnv {
  if (typeof process === 'undefined') return {}
  return process.env as unknown as AppEnv
}
