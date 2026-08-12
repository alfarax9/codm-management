import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function LoadoutsPage() {
  await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell
      title={t('loadouts')}
      description="Loadout tiap pemain, diperiksa terhadap ruleset yang sedang aktif."
    >
      <Pending
        label="Loadout & kepatuhan"
        items={[
          'Pilih senjata, attachment, perk, lethal, tactical, operator skill, scorestreak',
          'Item yang melanggar ditandai merah beserta alasannya',
          'Peringatan operator skill kembar dalam satu tim',
          'Pemeriksaan pool weapon class role: 3 AR / 3 SMG / 1 LMG / 1 Shotgun / 1 Marksman / 1 Sniper',
          'Panel kepatuhan tim: matriks 5 pemain kali kategori',
        ]}
      />
    </PageShell>
  )
}
