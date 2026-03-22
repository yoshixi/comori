#!/usr/bin/env npx tsx
/**
 * Applies Drizzle migrations to every tenant database.
 *
 * Usage:
 *   pnpm --filter @apps/backend run migrate:tenants
 *
 * Requires tenanso env vars (TURSO_ORG_SLUG, TURSO_API_TOKEN, etc.)
 * and the same DOTENV_CONFIG_PATH convention used by other drizzle scripts.
 */
import dotenv from 'dotenv'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { getTenanso } from '../src/app/core/common.db'

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env' })

const MIGRATIONS_FOLDER = './migrations'

async function main() {
  const tenanso = getTenanso()
  if (!tenanso) {
    console.error('Tenanso is not configured. Set TURSO_ORG_SLUG, TURSO_API_TOKEN, etc.')
    process.exit(1)
  }

  console.log('Listing tenants...')
  const tenants = await tenanso.listTenants()
  console.log(`Found ${tenants.length} tenant(s)`)

  let succeeded = 0
  let failed = 0

  for (const tenant of tenants) {
    try {
      console.log(`Migrating ${tenant}...`)
      await tenanso.withTenant(tenant, async (db) => {
        await migrate(db as Parameters<typeof migrate>[0], {
          migrationsFolder: MIGRATIONS_FOLDER,
        })
      })
      succeeded++
      console.log(`  ✓ ${tenant}`)
    } catch (error) {
      failed++
      console.error(`  ✗ ${tenant}:`, error)
    }
  }

  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed out of ${tenants.length} tenant(s)`)
  if (failed > 0) process.exit(1)
}

main()
