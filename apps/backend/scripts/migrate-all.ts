#!/usr/bin/env npx tsx
/**
 * Applies Drizzle migrations to all databases:
 *   1. Main (centralized) DB
 *   2. Seed DB
 *   3. All existing tenant DBs
 *
 * Usage:
 *   pnpm --filter @apps/backend run migrate:all
 */
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import * as schema from '../src/app/db/schema/schema'
import { getTenanso } from '../src/app/core/common.db'

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env' })

const MIGRATIONS_FOLDER = './migrations'

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

async function main() {
  // 1. Main DB
  const mainDbUrl = process.env.TURSO_MAIN_DB_URL
  const mainDbAuthToken = process.env.TURSO_MAIN_DB_AUTH_TOKEN
  if (!mainDbUrl) {
    console.error('TURSO_MAIN_DB_URL is required')
    process.exit(1)
  }

  console.log('Migrating main DB...')
  await migrateDb(mainDbUrl, mainDbAuthToken, 'main')

  // 2. Seed DB
  const seedDbName = process.env.TURSO_SEED_DB_NAME
  const orgSlug = process.env.TURSO_ORG_SLUG
  const groupAuthToken = process.env.TURSO_GROUP_AUTH_TOKEN
  if (seedDbName && orgSlug && groupAuthToken) {
    const seedUrl = `libsql://${seedDbName}-${orgSlug}.turso.io`
    console.log('Migrating seed DB...')
    await migrateDb(seedUrl, groupAuthToken, 'seed')
  } else {
    console.log('Skipping seed DB (missing env vars)')
  }

  // 3. All tenant DBs
  const tenanso = getTenanso()
  if (!tenanso) {
    console.log('Skipping tenant DBs (tenanso not configured)')
    return
  }

  console.log('Migrating tenant DBs...')
  const tenants = await tenanso.listTenants()
  const tenantDbs = tenants.filter((t) => t !== seedDbName)

  for (const [i, tenant] of tenantDbs.entries()) {
    try {
      await tenanso.withTenant(tenant, async (db) => {
        await migrate(db as Parameters<typeof migrate>[0], {
          migrationsFolder: MIGRATIONS_FOLDER,
        })
      })
    } catch (error) {
      console.error(`\n✗ tenant ${i + 1} failed:`, error instanceof Error ? error.message : error)
      process.exit(1)
    }
  }

  console.log('\nDone: all succeeded')
}

main()
