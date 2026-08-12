import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateOrgForm } from '@/features/org/components/create-org-form'
import { getOrgContext, requireUser } from '@/lib/auth/session'

export default async function OnboardingPage() {
  await requireUser()
  if (await getOrgContext()) redirect('/dashboard')

  const t = await getTranslations('org')

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
          <CardDescription>{t('createDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
      <LanguageSwitcher />
    </div>
  )
}
