import { AppSidebar } from '@/components/app-sidebar'
import { requireOrg } from '@/lib/auth/session'

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const ctx = await requireOrg()

  return (
    <div className="flex min-h-full">
      <AppSidebar orgName={ctx.orgName} userLabel={ctx.displayName ?? ctx.email} />
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  )
}
