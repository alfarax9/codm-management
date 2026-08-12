import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function SettingsPage() {
  const ctx = await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell title={t('settings')} description={`${ctx.orgName} — peran kamu: ${ctx.role}`}>
      <Pending
        label="Pengaturan organisasi"
        items={[
          'Roster: tambah tim baru (main, academy)',
          'Anggota dan peran: owner, admin, coach, analyst, player, viewer',
          'Undangan lewat email',
          'Lawan yang tercatat',
          'Minggu sebagai periode review',
          'Preferensi bahasa akun',
        ]}
      />
    </PageShell>
  )
}
