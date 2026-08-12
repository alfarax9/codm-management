'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { isLocale, LOCALE_COOKIE, type Locale } from './config'

const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * Ganti bahasa UI. Disimpan di cookie supaya berlaku juga sebelum user login;
 * preferensi permanen user tersimpan di `profiles.preferred_locale` dan
 * disinkronkan ke cookie ini saat login.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR,
    path: '/',
    sameSite: 'lax',
  })

  revalidatePath('/', 'layout')
}
