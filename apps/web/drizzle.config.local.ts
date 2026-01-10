import { defineConfig } from 'drizzle-kit';

// Local development configuration
// Uses schema push for fast iteration without migration history
export default defineConfig({
  schema: './app/db/schema/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './tmp/local.db'
  },
});
