import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignUpForm } from '@/features/auth/components/signup-form'
import { getUser } from '@/lib/auth/session'

export default async function SignUpPage() {
  if (await getUser()) redirect('/dashboard')

  const [tCommon, tAuth] = await Promise.all([
    getTranslations('common'),
    getTranslations('auth'),
  ])

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{tCommon('appName')}</CardTitle>
          <CardDescription>{tAuth('signUpDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
      <LanguageSwitcher />
    </div>
  )
}
