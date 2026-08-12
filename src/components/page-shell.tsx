import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

/**
 * Kerangka halaman. UI final tiap fitur menunggu design reference — komponen ini
 * menjaga judul, deskripsi, dan area aksi konsisten sampai desainnya masuk,
 * sehingga penggantinya nanti cukup mengubah satu tempat.
 */
export function PageShell({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/**
 * Penanda area yang fungsinya sudah disepakati tapi UI-nya belum dibangun.
 * Isinya diambil dari `messages/*.json` di `pages.<pageKey>` supaya ikut
 * berganti bahasa seperti bagian aplikasi lainnya.
 */
export async function FeaturePlaceholder({ pageKey }: { pageKey: string }) {
  const t = await getTranslations(`pages.${pageKey}`)
  const items = t.raw('items') as string[]

  return (
    <section className="rounded-lg border border-dashed border-border p-6">
      <p className="text-sm font-medium">{t('pending')}</p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-muted-foreground">
            — {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
