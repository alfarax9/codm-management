import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const t = await getTranslations('nav')

  return (
    <div>
      <h1 className="text-xl font-semibold">{t('dashboard')}</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Fase 2 — statistik tim akan muncul di sini setelah scrim pertama dilaporkan.
      </p>
    </div>
  )
}
