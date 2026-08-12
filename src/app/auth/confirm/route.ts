import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Tujuan tautan login dari email.
 *
 * Supabase mengirim dua bentuk tautan tergantung template email yang dipakai:
 *
 *   `?code=...`                 alur PKCE — template bawaan. Ini yang aktif
 *                               secara default, jadi harus ditangani.
 *   `?token_hash=...&type=...`  kalau template email diubah memakai
 *                               `{{ .TokenHash }}`.
 *
 * Keduanya didukung supaya mengubah template di dashboard tidak mematahkan login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`)

  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return error ? fail(error.message) : NextResponse.redirect(`${origin}${next}`)
  }

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    return error ? fail(error.message) : NextResponse.redirect(`${origin}${next}`)
  }

  // Verifikasi yang gagal di sisi Supabase dikirim balik sebagai query param.
  const supabaseError = searchParams.get('error_description') ?? searchParams.get('error')
  return fail(supabaseError ?? 'Tautan login tidak lengkap atau sudah pernah dipakai.')
}
