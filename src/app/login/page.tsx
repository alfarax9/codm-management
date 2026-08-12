import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/language-switcher'

export default async function LoginPage() {
  const t = await getTranslations('common')

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold">{t('appName')}</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Login belum diaktifkan — akan dipasang di Fase 1 bersama undangan organisasi.
        </p>
      </div>
      <LanguageSwitcher />
    </div>
  )
}
