import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function RulesPage() {
  await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell
      title={t('rules')}
      description="Unggah dokumen aturan turnamen, tinjau hasil bacanya, lalu aktifkan."
    >
      <Pending
        label="Ruleset"
        items={[
          'Unggah gambar atau PDF ruleset',
          'Hasil parsing AI ditandai sebagai draf yang perlu ditinjau',
          'Tinjau per kategori: senjata, attachment, perk, utility, operator skill, scorestreak, kosmetik',
          'Pengaturan lobby per mode dan map pool',
          'Pencarian: ketik nama item untuk tahu boleh atau dilarang',
          'Aktifkan ruleset — dipakai semua scrim yang menunjuk ke sana',
        ]}
      />
    </PageShell>
  )
}
