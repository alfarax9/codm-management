import { getTranslations } from 'next-intl/server'

import { FeaturePlaceholder, PageShell } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function DashboardPage() {
  const ctx = await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell title={t('dashboard')} description={ctx.orgName}>
      <FeaturePlaceholder pageKey="dashboard" />
    </PageShell>
  )
}
