import { type EmailOtpType } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'
import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_DESTINATION, resolveDestination, safeDestination } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

/**
 * Tujuan tautan verifikasi dari email: login, pendaftaran, dan reset kata sandi.
 *
 * Dua bentuk tautan didukung, karena keduanya bisa muncul tergantung template
 * email yang dipakai di dashboard Supabase:
 *
 *   `?token_hash=...&type=...`  disusun manual dengan `{{ .TokenHash }}`.
 *                               Tidak butuh cookie, jadi tetap bekerja walau
 *                               tautannya dibuka di perangkat lain.
 *   `?code=...`                 alur PKCE dari `{{ .ConfirmationURL }}` bawaan.
 *                               Butuh code verifier di cookie browser yang sama.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const supabase = await createClient()
  const t = await getTranslations('auth.messages')

  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`)

  const next = searchParams.get('next')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) return fail(error.message)
    return NextResponse.redirect(`${origin}${resolveDestination(type, next)}`)
  }

  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return fail(error.message)
    return NextResponse.redirect(`${origin}${safeDestination(next) ?? DEFAULT_DESTINATION}`)
  }

  // Verifikasi yang gagal di sisi Supabase dikirim balik sebagai query param.
  const supabaseError = searchParams.get('error_description') ?? searchParams.get('error')
  return fail(supabaseError ?? t('incompleteLink'))
}
