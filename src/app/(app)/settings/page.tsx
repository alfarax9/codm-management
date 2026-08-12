import { getTranslations } from 'next-intl/server'

import { FeaturePlaceholder, PageShell } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function SettingsPage() {
  const ctx = await requireOrg()
  const [tNav, tOrg] = await Promise.all([getTranslations('nav'), getTranslations('org')])

  return (
    <PageShell
      title={tNav('settings')}
      description={`${ctx.orgName} — ${tOrg('roleLabel')}: ${ctx.role}`}
    >
      <FeaturePlaceholder pageKey="settings" />
    </PageShell>
  )
}
