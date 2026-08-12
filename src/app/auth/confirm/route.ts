import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Tujuan tautan login dari email. Supabase mengirim `token_hash` + `type`;
 * verifikasi berhasil akan menuliskan cookie sesi lewat client server.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=tautan_tidak_lengkap`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=tautan_kedaluwarsa`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
