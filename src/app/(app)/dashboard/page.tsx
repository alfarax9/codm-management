import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function DashboardPage() {
  const ctx = await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell title={t('dashboard')} description={ctx.orgName}>
      <Pending
        label="Ringkasan tim — menunggu scrim pertama dilaporkan"
        items={[
          'Rekor menang–kalah dan win rate per mode',
          'Tren K/D tim beberapa scrim terakhir',
          'Map terkuat dan terlemah',
          'Scrim terjadwal berikutnya',
        ]}
      />
    </PageShell>
  )
}
