'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'

import { setLocale } from '@/i18n/actions'
import { LOCALE_LABELS, LOCALES, type Locale } from '@/i18n/config'
import { cn } from '@/lib/format'

export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale() as Locale
  const [isPending, startTransition] = useTransition()

  return (
    <div className={cn('flex gap-1 rounded-lg bg-surface p-1', className)}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => setLocale(locale))}
          aria-current={locale === current}
          title={LOCALE_LABELS[locale]}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium uppercase transition-colors',
            locale === current
              ? 'bg-accent text-accent-fg'
              : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
            isPending && 'opacity-60',
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  )
}
