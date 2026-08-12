import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  /** Tabel milik Supabase (auth, storage) jangan ikut di-drop saat push. */
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
})
