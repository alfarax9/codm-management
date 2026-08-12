'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { isMemberOf, ORG_COOKIE, requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

import {
  emailSchema,
  firstIssue,
  setPasswordSchema,
  signInSchema,
  signUpSchema,
} from './schema'

export type ActionState = { error?: string; message?: string }

async function siteOrigin() {
  const headerList = await headers()
  return headerList.get('origin') ?? ''
}

/**
 * Login dengan email dan kata sandi.
 *
 * Sesi disimpan Supabase sebagai cookie httpOnly dan diperpanjang otomatis oleh
 * `proxy.ts` pada setiap request, jadi user tetap masuk sampai keluar sendiri.
 */
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // Pesan Supabase sengaja tidak membedakan email tidak terdaftar dari kata
    // sandi salah, supaya tidak bisa dipakai menebak email mana yang terdaftar.
    if (error.code === 'email_not_confirmed') {
      return { error: 'Email kamu belum diverifikasi. Cek inbox untuk tautan verifikasinya.' }
    }
    return { error: 'Email atau kata sandi salah.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Pendaftaran akun. Supabase mengirim email verifikasi; akun baru bisa dipakai
 * login setelah tautannya dibuka.
 */
export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
  })

  if (error) return { error: error.message }

  // Supabase mengembalikan user tanpa identity kalau emailnya sudah terdaftar.
  // Responsnya dibuat sama dengan pendaftaran baru supaya tidak membocorkan
  // email mana yang sudah ada.
  if (data.user && data.user.identities?.length === 0) {
    return { message: 'Cek email kamu untuk melanjutkan.' }
  }

  return {
    message: `Tautan verifikasi sudah dikirim ke ${parsed.data.email}. Buka tautannya untuk mengaktifkan akun.`,
  }
}

/** Mengirim tautan untuk mengatur ulang kata sandi. */
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/akun/kata-sandi`,
  })

  // Selalu balas sama, berhasil atau tidak — kalau dibedakan, form ini bisa
  // dipakai memeriksa email mana yang terdaftar.
  return { message: 'Kalau email itu terdaftar, tautan penggantian kata sandi sudah dikirim.' }
}

/** Mengganti kata sandi user yang sedang login. */
export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser()

  const parsed = setPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) return { error: error.message }
  return { message: 'Kata sandi berhasil diperbarui.' }
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
