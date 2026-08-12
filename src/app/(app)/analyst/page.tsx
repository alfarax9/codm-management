import { getTranslations } from 'next-intl/server'

import { FeaturePlaceholder, PageShell } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function Page() {
  await requireOrg()
  const [tNav, tPage] = await Promise.all([
    getTranslations('nav'),
    getTranslations('pages.analyst'),
  ])

  return (
    <PageShell title={tNav('analyst')} description={tPage('description')}>
      <FeaturePlaceholder pageKey="analyst" />
    </PageShell>
  )
}
