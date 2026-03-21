import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env' })

const seedDbName = process.env.TURSO_SEED_DB_NAME
const orgSlug = process.env.TURSO_ORG_SLUG
const groupAuthToken = process.env.TURSO_GROUP_AUTH_TOKEN

if (!seedDbName || !orgSlug || !groupAuthToken) {
  throw new Error('TURSO_SEED_DB_NAME, TURSO_ORG_SLUG, and TURSO_GROUP_AUTH_TOKEN are required for seed DB config')
}

const seedUrl = `libsql://${seedDbName}-${orgSlug}.turso.io`

console.log(`[drizzle-config-seed] Using seed database: ${seedDbName}`)

export default defineConfig({
  schema: './src/app/db/schema/schema.ts',
  out: './migrations',
  dialect: 'turso',
  dbCredentials: {
    url: seedUrl,
    authToken: groupAuthToken,
  },
})
