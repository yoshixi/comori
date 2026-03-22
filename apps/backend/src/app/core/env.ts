/**
 * Centralized environment variable access.
 *
 * The Zod schema is the single source of truth for both the runtime
 * validation (validateEnv) and the TypeScript type (AppEnv).
 */
import { z } from 'zod'

const requiredString = z.string().min(1)

const appEnvSchema = z.object({
  // Authentication
  BETTER_AUTH_SECRET: requiredString,
  BETTER_AUTH_URL: requiredString,
  JWT_SECRET: requiredString,

  // Google OAuth
  GOOGLE_CLIENT_ID: requiredString,
  GOOGLE_CLIENT_SECRET: requiredString,
  GOOGLE_REDIRECT_URI: requiredString,

  // Centralized DB (Turso)
  TURSO_MAIN_DB_URL: requiredString,
  TURSO_MAIN_DB_AUTH_TOKEN: requiredString,

  // Multi-tenant (tenanso)
  TURSO_ORG_SLUG: requiredString,
  TURSO_API_TOKEN: requiredString,
  TURSO_GROUP: requiredString,
  TURSO_GROUP_AUTH_TOKEN: requiredString,
  TURSO_SEED_DB_NAME: requiredString,

  // Optional
  NODE_ENV: z.string().optional(),
  TRUSTED_ORIGINS: z.string().optional(),
  MOBILE_REDIRECT_URIS: z.string().optional(),
  SQLITE_URL: z.string().optional(),
  TURSO_TENANT_DB_URL: z.string().optional(),  // Computed from orgSlug by default
  TURSO_API_BASE_URL: z.string().optional(),    // Override for testing
  WEBHOOK_BASE_URL: z.string().optional(),
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
