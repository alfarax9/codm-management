'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { signOut } from '@/features/auth/actions'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', key: 'dashboard' },
  { href: '/scrims', key: 'scrims' },
  { href: '/roster', key: 'roster' },
  { href: '/loadouts', key: 'loadouts' },
  { href: '/rules', key: 'rules' },
  { href: '/maps', key: 'maps' },
  { href: '/formats', key: 'formats' },
  { href: '/analytics', key: 'analytics' },
  { href: '/analyst', key: 'analyst' },
  { href: '/settings', key: 'settings' },
] as const

export function AppSidebar({ orgName, userLabel }: { orgName: string; userLabel: string }) {
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
      <div className="mb-6 px-2">
        <p className="truncate text-sm font-semibold">{orgName}</p>
        <p className="truncate text-xs text-muted-foreground">{userLabel}</p>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-md px-2 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              {t(item.key)}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <LanguageSwitcher className="self-start" />
        <Link
          href="/akun/kata-sandi"
          className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {tAuth('changePasswordTitle')}
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            {tAuth('signOut')}
          </Button>
        </form>
      </div>
    </aside>
  )
}
