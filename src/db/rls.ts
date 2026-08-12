import { sql } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { ExtractTablesWithRelations } from 'drizzle-orm'

import { db, schema } from '.'

export type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

/**
 * Menjalankan query sebagai user yang sedang login, sehingga policy RLS berlaku.
 *
 * Ini penting: `DATABASE_URL` memakai role pemilik database yang secara default
 * MELEWATI RLS. Tanpa pembungkus ini, seluruh policy di migrasi 0001 tidak
 * berpengaruh sama sekali pada query aplikasi — Drizzle akan melihat semua baris
 * milik semua organisasi.
 *
 * `SET LOCAL` hanya berlaku sampai transaksi selesai, jadi koneksi yang
 * dikembalikan ke pool tidak membawa identitas request sebelumnya.
 */
export async function withRls<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: 'authenticated' })
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`)
    await tx.execute(sql`set local role authenticated`)
    return fn(tx as Tx)
  })
}

/**
 * Query yang sengaja melewati RLS. Hanya untuk alur yang belum punya identitas
 * user — mis. menukar token undangan dengan keanggotaan. Setiap pemakaian wajib
 * memvalidasi otorisasinya sendiri di kode.
 */
export const adminDb = db
