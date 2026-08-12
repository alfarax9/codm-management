/**
 * postgres.js membungkus error database: `error.message` hanya berisi teks SQL
 * yang gagal beserta parameternya, sedangkan sebab sesungguhnya — pelanggaran
 * RLS, unique constraint, foreign key — ada di `error.cause`.
 *
 * Tanpa pembongkaran ini, setiap kegagalan database tampil di UI sebagai
 * "Failed query: insert into ..." yang tidak memberi tahu apa pun.
 */

type PgCause = { code?: string; message?: string; detail?: string; constraint_name?: string }

function pgCause(error: unknown): PgCause | null {
  if (!(error instanceof Error) || !error.cause) return null
  const cause = error.cause as PgCause
  return typeof cause === 'object' && cause !== null ? cause : null
}

/** Pesan siap tampil untuk pengguna, sudah diterjemahkan dari kode Postgres. */
export function toUserMessage(error: unknown, fallback: string): string {
  const cause = pgCause(error)

  switch (cause?.code) {
    case '23505': // unique_violation
      return 'Data dengan nilai itu sudah ada.'
    case '23503': // foreign_key_violation
      return 'Data yang dirujuk tidak ditemukan.'
    case '42501': // insufficient_privilege — hampir selalu RLS
      return 'Kamu tidak punya izin untuk melakukan ini.'
    case '23514': // check_violation
      return 'Nilai yang dimasukkan tidak memenuhi aturan yang berlaku.'
  }

  if (cause?.message) return cause.message
  if (error instanceof Error && !error.message.startsWith('Failed query')) return error.message
  return fallback
}

/** Detail teknis untuk log server — jangan ditampilkan ke pengguna. */
export function toLogMessage(error: unknown): string {
  const cause = pgCause(error)
  if (cause) {
    return [cause.code, cause.message, cause.detail].filter(Boolean).join(' | ')
  }
  return error instanceof Error ? error.message : String(error)
}
