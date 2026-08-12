'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'

import { isMemberOf, ORG_COOKIE, requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error?: string; message?: string }

const emailSchema = z.email({ message: 'Format email tidak valid.' })

/**
 * Login lewat tautan sekali pakai yang dikirim ke email. Dipilih karena
 * aplikasi ini tertutup dan hanya dipakai anggota organisasi — tanpa kata sandi
 * berarti tidak ada kata sandi yang bisa bocor atau perlu direset.
 */
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const headerList = await headers()
  const origin = headerList.get('origin') ?? ''

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  })

  if (error) return { error: error.message }
  return { message: `Tautan login sudah dikirim ke ${parsed.data}. Cek inbox kamu.` }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/** Berpindah organisasi aktif. Ditolak kalau user bukan anggotanya. */
export async function switchOrg(orgId: string) {
  const user = await requireUser()
  if (!(await isMemberOf(user.id, orgId))) {
    throw new Error('Kamu bukan anggota organisasi tersebut.')
  }

  const cookieStore = await cookies()
  cookieStore.set(ORG_COOKIE, orgId, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  redirect('/dashboard')
}
