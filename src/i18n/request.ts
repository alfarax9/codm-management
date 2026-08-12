import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from './config'

/**
 * Bahasa diambil dari cookie, bukan dari segmen URL. Aplikasi ini ada di balik
 * login dan tiap halaman punya satu alamat saja — menambah prefix `/id` dan `/en`
 * cuma menggandakan route tanpa manfaat SEO.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
