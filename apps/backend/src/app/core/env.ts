/**
 * Centralized environment variable access.
 *
 * The Zod schema is the single source of truth for both the runtime
 * validation (validateEnv) and the TypeScript type (AppEnv).
 */
import { z } from 'zod'

const requiredString = z.string().min(1)

/** Node-style runtime mode (see `process.env.NODE_ENV`). */
export const NODE_ENV_VALUES = ['development', 'production', 'test'] as const
export type NodeEnv = (typeof NODE_ENV_VALUES)[number]

/** Pino log levels (`silent` disables logging). */
export const LOG_LEVEL_VALUES = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'silent',
] as const
export type LogLevel = (typeof LOG_LEVEL_VALUES)[number]

/** `.env` often has empty values; treat those as unset. */
function emptyEnvToUndefined(val: unknown): unknown {
  if (val === '' || val === undefined) return undefined
  return val
}

const optionalNodeEnvSchema = z.preprocess(
  emptyEnvToUndefined,
  z.enum(NODE_ENV_VALUES).optional()
).describe('Node/runtime mode: development, production, or test.')

const optionalLogLevelSchema = z.preprocess(
  emptyEnvToUndefined,
  z.enum(LOG_LEVEL_VALUES).optional()
).describe(
  'Pino log level: trace, debug, info, warn, error, fatal, or silent.'
)

const appEnvSchema = z.object({
  // Authentication
  BETTER_AUTH_SECRET: requiredString.describe(
    'Better Auth secret for signing sessions and tokens (use a long random value).'
  ),
  BETTER_AUTH_URL: requiredString.describe(
    'Public base URL of this API; used as the auth server URL / JWT issuer.'
  ),
  JWT_SECRET: requiredString.describe(
    'Secret key for signing and verifying JWTs issued by this service.'
  ),

  // Google OAuth
  GOOGLE_CLIENT_ID: requiredString.describe('Google OAuth 2.0 client ID.'),
  GOOGLE_CLIENT_SECRET: requiredString.describe('Google OAuth 2.0 client secret.'),
  GOOGLE_REDIRECT_URI: requiredString.describe(
    'Registered redirect URI for Google OAuth (must match Google Cloud console).'
  ),

  // Centralized DB (Turso)
  TURSO_MAIN_DB_URL: requiredString.describe(
    'libsql:// URL for the main database (users, sessions, accounts).'
  ),
  TURSO_MAIN_DB_AUTH_TOKEN: requiredString.describe(
    'Turso auth token for the main libsql database (placeholder value is fine for file: URLs in local dev).'
  ),

  // Multi-tenant (tenanso)
  TURSO_ORG_SLUG: requiredString.describe('Turso organization slug used in tenant DB hostnames.'),
  TURSO_API_TOKEN: requiredString.describe(
    'Turso platform API token for creating and managing tenant databases.'
  ),
  TURSO_GROUP: requiredString.describe(
    'Logical database group name; prefixes tenant DB names (e.g. default-user-123).'
  ),
  TURSO_GROUP_AUTH_TOKEN: requiredString.describe(
    'Auth token for tenant databases in the Turso group.'
  ),
  TURSO_SEED_DB_NAME: requiredString.describe(
    'Name of the seed database cloned when provisioning a new tenant.'
  ),

  // Optional
  NODE_ENV: optionalNodeEnvSchema,
  LOG_LEVEL: optionalLogLevelSchema,
  TRUSTED_ORIGINS: z
    .string()
    .optional()
    .describe('Comma-separated browser origins allowed for Better Auth / CORS.'),
  MOBILE_REDIRECT_URIS: z
    .string()
    .optional()
    .describe(
      'Comma-separated custom scheme / app redirect URIs for mobile OAuth flows.'
    ),
  SQLITE_URL: z
    .string()
    .optional()
    .describe(
      'file: URL for local SQLite when the main DB is not a remote Turso URL.'
    ),
  TURSO_TENANT_DB_URL: z
    .string()
    .optional()
    .describe(
      'Override tenant database URL template; use {tenant} placeholder if needed.'
    ),
  TURSO_API_BASE_URL: z
    .string()
    .optional()
    .describe('Override Turso API base URL (mainly for tests or mocks).'),
  WEBHOOK_BASE_URL: z
    .string()
    .optional()
    .describe(
      'Public HTTPS base URL for Google Calendar push notification webhook endpoints.'
    ),
})

export type AppEnv = z.infer<typeof appEnvSchema>

/**
 * Validates that all required env vars are present.
 * Call once at application startup. Throws if any are missing.
 */
export function validateEnv(): void {
  const result = appEnvSchema.safeParse(process.env)
  if (!result.success) {
    const messages = result.error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`
    )
    throw new Error(
      `Invalid environment variables:\n${messages.join('\n')}`
    )
  }
}

/**
 * Returns typed env vars from process.env.
 */
export function getEnv(): AppEnv {
  if (typeof process === 'undefined') return {} as AppEnv
  return process.env as unknown as AppEnv
}
