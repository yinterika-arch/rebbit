import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'
config({ path: '.env.local' })

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
  },
} satisfies Config
