import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form'
import { getUser } from '@/lib/auth/session'

export default async function ForgotPasswordPage() {
  if (await getUser()) redirect('/dashboard')

  const t = await getTranslations('auth')

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('forgotPasswordTitle')}</CardTitle>
          <CardDescription>{t('forgotPasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
      <LanguageSwitcher />
    </div>
  )
}
