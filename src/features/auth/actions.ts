'use server'

import type { EmailOtpType } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { isMemberOf, ORG_COOKIE, requireUser } from '@/lib/auth/session'
import { AppError } from '@/lib/errors'
import { resolveDestination } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

import { emailSchema, setPasswordSchema, signInSchema, signUpSchema } from './schema'

export type ActionState = { error?: string; message?: string }

async function siteOrigin() {
  const headerList = await headers()
  return headerList.get('origin') ?? ''
}

/**
 * Pesan validasi Zod disimpan sebagai kunci terjemahan, bukan kalimat jadi,
 * supaya ikut berganti bahasa seperti sisa aplikasi.
 */
async function authMessages() {
  return getTranslations('auth.messages')
}

/**
 * Login dengan email dan kata sandi.
 *
 * Sesi disimpan Supabase sebagai cookie httpOnly dan diperpanjang otomatis oleh
 * `proxy.ts` pada setiap request, jadi user tetap masuk sampai keluar sendiri.
 */
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await authMessages()

  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.code === 'email_not_confirmed') return { error: t('emailNotConfirmed') }
    // Email tidak terdaftar dan kata sandi salah sengaja tidak dibedakan —
    // kalau dibedakan, form ini bisa dipakai memeriksa email siapa yang punya akun.
    return { error: t('invalidCredentials') }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Pendaftaran akun. Supabase mengirim email verifikasi; akun baru bisa dipakai
 * login setelah tautannya dibuka.
 */
export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await authMessages()

  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
  })

  if (error) return { error: error.message }

  /*
   * Untuk email yang sudah terdaftar, Supabase tidak mengirim apa pun dan tetap
   * membalas sukses — perlindungan agar form ini tidak bisa dipakai menebak email
   * mana yang punya akun. Karena itu pesannya menyebut kedua kemungkinan
   * sekaligus: pengguna tahu langkah berikutnya tanpa kita membocorkan
   * kasus mana yang sedang terjadi.
   */
  return { message: t('signUpResult', { email: parsed.data.email }) }
}

/** Mengirim tautan untuk mengatur ulang kata sandi. */
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await authMessages()

  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) return { error: t('invalidEmail') }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/akun/kata-sandi`,
  })

  // Balasannya selalu sama, berhasil atau tidak — sama alasannya dengan signUp.
  return { message: t('resetLinkSent') }
}

/** Mengganti kata sandi user yang sedang login. */
export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser()
  const t = await authMessages()

  const parsed = setPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) return { error: error.message }
  return { message: t('passwordUpdated') }
}

/**
 * Menyelesaikan verifikasi tautan email (pendaftaran, reset kata sandi).
 *
 * Dipanggil dari form di `/auth/confirm` setelah pengguna sendiri yang menekan
 * tombol — bukan otomatis saat halaman dibuka. `token_hash` hanya sekali pakai,
 * dan penyedia email memindai tautan secara otomatis lewat GET sebelum
 * penggunanya sendiri membukanya, sehingga verifikasi otomatis di GET membuat
 * token habis duluan. Form butuh submit sungguhan, yang tidak dilakukan
 * pemindai otomatis.
 */
export async function confirmEmailLink(formData: FormData): Promise<void> {
  const tokenHash = formData.get('token_hash')
  const type = formData.get('type')
  const next = formData.get('next')

  if (typeof tokenHash !== 'string' || typeof type !== 'string') {
    redirect('/login')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  })

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)

  redirect(resolveDestination(type as EmailOtpType, typeof next === 'string' ? next : null))
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
    throw new AppError('session.notMember')
  }

  const cookieStore = await cookies()
  cookieStore.set(ORG_COOKIE, orgId, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  redirect('/dashboard')
}
