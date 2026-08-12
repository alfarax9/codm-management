/**
 * Penanganan error yang bisa diterjemahkan.
 *
 * Aturan di project ini: kode TIDAK PERNAH menyusun kalimat untuk pengguna.
 * Yang dilempar dan dikembalikan adalah KUNCI terjemahan; penerjemahan terjadi
 * di tepi — Server Action atau Route Handler — memakai bahasa yang sedang aktif.
 * Kalau kalimatnya ditulis langsung di logika, pengguna English akan tetap
 * menerima pesan Bahasa Indonesia betapa pun lengkapnya file terjemahan.
 */

export type MessageParams = Record<string, string | number>

/** Error dengan pesan yang sudah punya padanan di `messages/*.json`. */
export class AppError extends Error {
  constructor(
    readonly key: string,
    readonly params?: MessageParams,
  ) {
    super(key)
    this.name = 'AppError'
  }
}

type PgCause = { code?: string; message?: string; detail?: string }

/**
 * postgres.js membungkus error database: `error.message` hanya berisi teks SQL
 * yang gagal, sedangkan sebab sesungguhnya ada di `error.cause`.
 */
function pgCause(error: unknown): PgCause | null {
  if (!(error instanceof Error) || !error.cause) return null
  const cause = error.cause as PgCause
  return typeof cause === 'object' && cause !== null ? cause : null
}

/** Kode Postgres → kunci terjemahan. */
const PG_ERROR_KEYS: Record<string, string> = {
  '23505': 'errors.uniqueViolation',
  '23503': 'errors.foreignKeyViolation',
  '42501': 'errors.insufficientPrivilege',
  '23514': 'errors.checkViolation',
}

/**
 * Menerjemahkan error apa pun menjadi kunci pesan siap pakai.
 * `fallbackKey` dipakai kalau penyebabnya tidak dikenali.
 */
export function resolveErrorKey(
  error: unknown,
  fallbackKey: string,
): { key: string; params?: MessageParams } {
  if (error instanceof AppError) return { key: error.key, params: error.params }

  const code = pgCause(error)?.code
  if (code && PG_ERROR_KEYS[code]) return { key: PG_ERROR_KEYS[code] }

  return { key: fallbackKey }
}

/** Detail teknis untuk log server — tidak pernah ditampilkan ke pengguna. */
export function toLogMessage(error: unknown): string {
  const cause = pgCause(error)
  if (cause) return [cause.code, cause.message, cause.detail].filter(Boolean).join(' | ')
  return error instanceof Error ? error.message : String(error)
}
