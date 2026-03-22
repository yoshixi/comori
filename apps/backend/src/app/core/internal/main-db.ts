/**
 * Internal module — owns the centralized (main) database connection.
 *
 * Only core modules (auth, oauth-service, exchange-codes) should import from here.
 * Handlers must NEVER import from internal/ — use the user-scoped services instead.
 */
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../../db/schema/schema'
import type { DB } from '../common.db'
import { getEnv } from '../env'

const DRIZZLE_CONFIG = {
  casing: 'snake_case' as const,
}

let mainDbInstance: ReturnType<typeof drizzleLibsql> | null = null

/**
 * Returns the centralized (main) database used for auth tables
 * (users, sessions, accounts, verifications, oauth_exchange_codes).
 */
export function getMainDb(): DB {
  const env = getEnv()
  if (mainDbInstance) return mainDbInstance as unknown as DB

  if (env.TURSO_MAIN_DB_URL && env.TURSO_MAIN_DB_AUTH_TOKEN) {
    mainDbInstance = drizzleLibsql({
      connection: {
        url: env.TURSO_MAIN_DB_URL,
        authToken: env.TURSO_MAIN_DB_AUTH_TOKEN
      },
      schema,
      ...DRIZZLE_CONFIG
    })
    return mainDbInstance as unknown as DB
  }

  // Local dev fallback: SQLite file
  const sqliteUrl = env.SQLITE_URL || 'file:./tmp/local.db'
  mainDbInstance = drizzleLibsql({
    client: createClient({ url: sqliteUrl }),
    schema,
    ...DRIZZLE_CONFIG,
  })
  return mainDbInstance as unknown as DB
}

export const resetMainDbForTests = () => {
  mainDbInstance = null
}
