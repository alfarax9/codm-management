import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

import en from '../../messages/en.json'
import id from '../../messages/id.json'

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config'

/**
 * Terjemahan di-import statis, bukan lewat `import()` dengan template literal.
 *
 * Dengan jalur dinamis, bundler tidak bisa melihat file mana yang dipakai,
 * sehingga mengubah `messages/*.json` tidak memicu muat ulang — kunci baru
 * tampil sebagai MISSING_MESSAGE sampai dev server direstart. Import statis
 * membuat file JSON menjadi dependensi yang terlacak, dan HMR bekerja.
 */
const MESSAGES: Record<Locale, typeof id> = { id, en }

/**
 * Bahasa diambil dari cookie, bukan dari segmen URL. Aplikasi ini ada di balik
 * login dan tiap halaman punya satu alamat saja — menambah prefix `/id` dan `/en`
 * hanya menggandakan route tanpa manfaat SEO.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE

  return { locale, messages: MESSAGES[locale] }
})
