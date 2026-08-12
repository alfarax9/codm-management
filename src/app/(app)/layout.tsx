import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { LanguageSwitcher } from '@/components/language-switcher'

const NAV = [
  { href: '/dashboard', key: 'dashboard' },
  { href: '/scrims', key: 'scrims' },
  { href: '/roster', key: 'roster' },
  { href: '/maps', key: 'maps' },
  { href: '/formats', key: 'formats' },
  { href: '/rules', key: 'rules' },
  { href: '/analyst', key: 'analyst' },
] as const

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const t = await getTranslations('nav')
  const tc = await getTranslations('common')

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface/40 p-4 md:flex">
        <Link href="/dashboard" className="mb-6 px-2 text-sm font-bold tracking-tight">
          {tc('appName')}
        </Link>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <LanguageSwitcher className="mt-auto self-start" />
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  )
}
