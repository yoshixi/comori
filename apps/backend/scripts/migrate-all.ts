#!/usr/bin/env npx tsx
/**
 * Applies Drizzle migrations to all databases:
 *   1. Main (centralized) DB
 *   2. Seed DB
 *   3. All existing tenant DBs
 *
 * Options:
 *   --reset-tenants  Drop all tables in tenant DBs before migrating (for schema revamps)
 *
 * Usage:
 *   pnpm --filter @apps/backend run migrate:all
 *   pnpm --filter @apps/backend run migrate:all -- --reset-tenants
 */
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { sql } from 'drizzle-orm'
import * as schema from '../src/app/db/schema/schema'
import { getTenanso } from '../src/app/core/common.db'

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env' })

const MIGRATIONS_FOLDER = './migrations'
const resetTenants = process.argv.includes('--reset-tenants')

async function migrateDb(url: string, authToken?: string, label?: string) {
  const client = createClient({
    url,
    ...(authToken ? { authToken } : {}),
  })
  const db = drizzle({ client, schema, casing: 'snake_case' })
  await migrate(db as Parameters<typeof migrate>[0], {
    migrationsFolder: MIGRATIONS_FOLDER,
  })
  console.log(`  ✓ ${label}`)
}

async function resetTenantDb(url: string, authToken: string, label: string, userRecord?: { id: number; name: string; email: string }) {
  // Use a raw libsql client to drop all tables, then re-migrate
  const client = createClient({ url, authToken })

  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'"
  )
  const tableNames = result.rows.map((r) => r.name as string)

  await client.execute('PRAGMA foreign_keys = OFF')
  for (const name of tableNames) {
    await client.execute(`DROP TABLE IF EXISTS "${name}"`)
  }
  await client.execute('PRAGMA foreign_keys = ON')
  await client.execute('DROP TABLE IF EXISTS "__drizzle_migrations"')
  console.log(`  ✓ ${label} (dropped ${tableNames.length} tables)`)

  // Now migrate with a fresh drizzle instance
  const db = drizzle({ client, schema, casing: 'snake_case' })
  await migrate(db as Parameters<typeof migrate>[0], {
    migrationsFolder: MIGRATIONS_FOLDER,
  })

  // Re-seed user record (required for FK constraints on tenant tables)
  if (userRecord) {
    await db
      .insert(schema.usersTable)
      .values({ id: userRecord.id, name: userRecord.name, email: userRecord.email })
      .onConflictDoNothing()
    console.log(`  ✓ re-seeded user ${userRecord.id} (${userRecord.email})`)
  }
}

/** Extract user ID from tenant name (e.g. "default-user-42" -> 42) */
function userIdFromTenantName(tenant: string): number | null {
  const match = tenant.match(/-user-(\d+)$/)
  return match ? Number(match[1]) : null
}

/** Load user records from main DB for re-seeding after reset */
async function loadUsersFromMainDb(mainDbUrl: string, mainDbAuthToken?: string): Promise<Map<number, { id: number; name: string; email: string }>> {
  const client = createClient({ url: mainDbUrl, ...(mainDbAuthToken ? { authToken: mainDbAuthToken } : {}) })
  const db = drizzle({ client, schema, casing: 'snake_case' })
  const users = await db.select({ id: schema.usersTable.id, name: schema.usersTable.name, email: schema.usersTable.email }).from(schema.usersTable)
  return new Map(users.map(u => [u.id, u]))
}

async function main() {
  // 1. Main DB — skip if tables already exist (just run migrate, it's idempotent for already-applied migrations)
  const mainDbUrl = process.env.TURSO_MAIN_DB_URL
  const mainDbAuthToken = process.env.TURSO_MAIN_DB_AUTH_TOKEN
  if (!mainDbUrl) {
    console.error('TURSO_MAIN_DB_URL is required')
    process.exit(1)
  }

  console.log('Migrating main DB...')
  try {
    await migrateDb(mainDbUrl, mainDbAuthToken, 'main')
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('already exists')) {
      console.log('  ⏭ main DB already has tables, skipping migration (tables exist)')
    } else {
      throw error
    }
  }

  // 2. Seed DB
  const seedDbName = process.env.TURSO_SEED_DB_NAME
  const orgSlug = process.env.TURSO_ORG_SLUG
  const groupAuthToken = process.env.TURSO_GROUP_AUTH_TOKEN
  if (seedDbName && orgSlug && groupAuthToken) {
    const seedUrl = `libsql://${seedDbName}-${orgSlug}.turso.io`
    console.log('Migrating seed DB...')
    try {
      await migrateDb(seedUrl, groupAuthToken, 'seed')
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('already exists')) {
        console.log('  ⏭ seed DB already has tables, skipping migration')
      } else {
        throw error
      }
    }
  } else {
    console.log('Skipping seed DB (missing env vars)')
  }

  // 3. All tenant DBs
  const tenanso = getTenanso()
  if (!tenanso) {
    console.log('Skipping tenant DBs (tenanso not configured)')
    return
  }

  console.log(`Migrating tenant DBs...${resetTenants ? ' (with --reset-tenants)' : ''}`)
  const tenants = await tenanso.listTenants()
  const tenantDbs = tenants.filter((t) => t !== seedDbName)
  console.log(`  Found ${tenantDbs.length} tenant(s) ${tenantDbs.join(', ')}`)

  // Load user records from main DB for re-seeding after reset
  let userMap: Map<number, { id: number; name: string; email: string }> | null = null
  if (resetTenants) {
    userMap = await loadUsersFromMainDb(mainDbUrl, mainDbAuthToken)
    console.log(`  Loaded ${userMap.size} user(s) from main DB for re-seeding`)
  }

  const tenantDbUrlTemplate = process.env.TURSO_TENANT_DB_URL || `libsql://{tenant}-${orgSlug}.turso.io`

  for (const [i, tenant] of tenantDbs.entries()) {
    const tenantUrl = tenantDbUrlTemplate.replace('{tenant}', tenant)
    try {
      if (resetTenants) {
        const userId = userIdFromTenantName(tenant)
        const userRecord = userId != null ? userMap?.get(userId) : undefined
        await resetTenantDb(tenantUrl, groupAuthToken!, `reset ${tenant}`, userRecord ?? undefined)
        console.log(`  ✓ tenant ${i + 1}/${tenantDbs.length}: ${tenant} (reset + migrated)`)
      } else {
        await migrateDb(tenantUrl, groupAuthToken, `tenant ${i + 1}/${tenantDbs.length}: ${tenant}`)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('already exists') && !resetTenants) {
        console.log(`  ⏭ tenant ${i + 1}/${tenantDbs.length}: ${tenant} (tables exist, use --reset-tenants to force)`)
      } else {
        console.error(`\n✗ tenant ${i + 1} failed:`, msg)
        process.exit(1)
      }
    }
  }

  console.log('\nDone: all succeeded')
}

main()
