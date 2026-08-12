import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '@/lib/env'

import * as schema from './schema'

/**
 * Satu koneksi per proses. Di dev, Next.js me-reload modul tiap perubahan file —
 * tanpa cache di globalThis, tiap reload membuka pool baru sampai Postgres menolak.
 */
const globalForDb = globalThis as unknown as { pool?: ReturnType<typeof postgres> }

const pool =
  globalForDb.pool ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === 'production' ? 10 : 2,
    prepare: false, // Supabase pooler (transaction mode) tidak mendukung prepared statement
  })

if (env.NODE_ENV !== 'production') globalForDb.pool = pool

export const db = drizzle(pool, { schema })
export { schema }
