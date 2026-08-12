import type { EmailOtpType } from '@supabase/supabase-js'

/** Halaman tujuan setelah verifikasi berhasil, ditentukan jenis tautannya. */
const DESTINATION_BY_TYPE: Partial<Record<EmailOtpType, string>> = {
  recovery: '/akun/kata-sandi',
  email_change: '/akun/kata-sandi',
}

export const DEFAULT_DESTINATION = '/dashboard'

/**
 * Hanya menerima jalur relatif di dalam aplikasi ini.
 *
 * `next` berasal dari URL yang bisa disusun siapa saja. Tanpa penyaringan,
 * nilai seperti `//situs-lain.com` diperlakukan browser sebagai alamat absolut —
 * tautan "verifikasi" dari domain kita berujung di situs orang lain.
 */
export function safeDestination(next: string | null | undefined): string | null {
  if (!next) return null
  if (!next.startsWith('/')) return null
  if (next.startsWith('//')) return null
  // `/\` juga diperlakukan sebagian browser sebagai protocol-relative.
  if (next.startsWith('/\\')) return null
  return next
}

/**
 * Tujuan akhir setelah tautan email berhasil diverifikasi.
 *
 * Jenis tautan yang menentukan, bukan parameter `next`. Template email yang
 * menyusun URL-nya sendiri dari `{{ .SiteURL }}` tidak membawa `redirectTo`
 * yang dikirim aplikasi, sehingga `next` kerap hilang — dan tautan reset kata
 * sandi berakhir di dasbor, bukan di form kata sandi. `next` tetap dihormati
 * kalau ada dan aman, sebagai penimpa yang disengaja.
 */
export function resolveDestination(
  type: EmailOtpType | null,
  next?: string | null,
): string {
  return (
    safeDestination(next) ?? (type ? DESTINATION_BY_TYPE[type] : undefined) ?? DEFAULT_DESTINATION
  )
}
