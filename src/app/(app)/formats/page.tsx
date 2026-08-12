import { getTranslations } from 'next-intl/server'

import { PageShell, Pending } from '@/components/page-shell'
import { requireOrg } from '@/lib/auth/session'

export default async function FormatsPage() {
  await requireOrg()
  const t = await getTranslations('nav')

  return (
    <PageShell
      title={t('formats')}
      description="Kode format menentukan jumlah map per mode. Urutan mainnya bebas."
    >
      <Pending
        label="Format scrim"
        items={[
          'Daftar format yang sudah ada beserta jumlah game-nya',
          'Format Builder: atur jumlah map per mode, kode dan total game dihitung otomatis',
          'Nonaktifkan format yang tidak lagi dipakai',
        ]}
      />
    </PageShell>
  )
}
