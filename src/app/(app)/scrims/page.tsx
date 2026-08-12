import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function ScrimsPage() {
  await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell
      title={t('scrims')}
      description="Daftar scrim, pengisian hasil per map, dan alur ronde."
    >
      <Pending
        label="Riwayat scrim"
        items={[
          'Buat scrim: lawan, format (mis. 232), jadwal, ruleset yang dipakai',
          'Slot game dibuat sesuai kuota format; mode tiap slot dipilih dari sisa kuota',
          'Report Scores: hasil map, skor, dan tabel stat pemain per mode',
          'Kolom stat mengikuti mode — Hardpoint dan Control punya kolom Waktu',
          'Auto-fill dari screenshot scoreboard',
          'Map Flow: ronde SnD, hill Hardpoint, ronde Control',
        ]}
      />
    </PageShell>
  )
}
