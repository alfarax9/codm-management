import 'server-only'

import { Resend } from 'resend'

import { env } from '@/lib/env'

/**
 * Pengiriman email yang dipicu aplikasi sendiri — misalnya undangan organisasi.
 *
 * PENTING: email login (magic link) TIDAK melewati modul ini. Itu dikirim oleh
 * mailer internal Supabase saat `signInWithOtp()` dipanggil, jadi rate limit-nya
 * tidak bisa diperbaiki dari kode. Solusinya memasang SMTP Resend di dashboard
 * Supabase (Authentication → Emails → SMTP Settings).
 *
 * Client dibuat malas: tanpa `RESEND_API_KEY`, `Resend` melempar error saat
 * dikonstruksi — kalau dibuat di level modul, aplikasi gagal boot hanya karena
 * fitur email belum dipakai.
 */
let client: Resend | null = null

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null
  client ??= new Resend(env.RESEND_API_KEY)
  return client
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string }

/**
 * Mengembalikan hasil, bukan melempar. Pengiriman email adalah efek samping —
 * gagal kirim undangan tidak boleh membatalkan transaksi yang sudah berhasil.
 * Pemanggil yang memutuskan apakah kegagalan itu penting.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  const resend = getClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY belum diisi — pengiriman email dilewati.' }
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  })

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Resend tidak mengembalikan id pengiriman.' }

  return { ok: true, id: data.id }
}
