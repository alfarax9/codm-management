import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function AnalyticsPage() {
  await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell title={t('analytics')} description="Analisis dari statistik scrim yang tercatat.">
      <Pending
        label="Analitik"
        items={[
          'Win rate per map dan per mode',
          'Head-to-head melawan lawan tertentu',
          'Map yang K/D-nya positif tapi tetap kalah',
          'Map yang K/D-nya negatif tapi menang',
          'SnD yang berlanjut sampai ronde penentuan',
          'Alur skor: hill demi hill, ronde demi ronde',
        ]}
      />
    </PageShell>
  )
}
