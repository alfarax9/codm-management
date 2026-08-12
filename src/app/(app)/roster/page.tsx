import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function RosterPage() {
  await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell title={t('roster')} description="Pemain per roster, peran, dan statistiknya.">
      <Pending
        label="Manajemen roster"
        items={[
          'Tambah pemain: IGN, UID, alias untuk pencocokan scoreboard',
          'Weapon class role yang dideklarasikan tiap pemain',
          'Tandai pemain cadangan dan pemain non-aktif',
          'Kartu statistik ringkas per pemain',
          'Hubungkan pemain ke akun agar bisa mengisi loadout sendiri',
        ]}
      />
    </PageShell>
  )
}
