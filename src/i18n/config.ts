export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'id'

export const LOCALE_LABELS: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
}

export const LOCALE_COOKIE = 'codm_locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}
