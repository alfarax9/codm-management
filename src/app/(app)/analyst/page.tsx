import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function AnalystPage() {
  await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell
      title={t('analyst')}
      description="Penugasan analyst dan rapor performa mingguan tiap pemain."
    >
      <Pending
        label="Analyst"
        items={[
          'Tugaskan analyst per scrim atau per minggu, opsional fokus ke satu pemain',
          'Inbox tugas: belum dikerjakan, sedang dikerjakan, selesai',
          'Rapor mingguan per pemain: metrik terhitung, nilai, dan perubahan dari minggu lalu',
          'Kekuatan dan kelemahan ditulis analyst, dengan tombol draf AI dari angka',
          'Ringkasan tim: mode terlemah dan map yang sebaiknya di-ban',
        ]}
      />
    </PageShell>
  )
}
