import { getTranslations } from 'next-intl/server'

import { FeaturePlaceholder, PageShell } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function Page() {
  await requireOrg()
  const [tNav, tPage] = await Promise.all([
    getTranslations('nav'),
    getTranslations('pages.scrims'),
  ])

  return (
    <PageShell title={tNav('scrims')} description={tPage('description')}>
      <FeaturePlaceholder pageKey="scrims" />
    </PageShell>
  )
}
