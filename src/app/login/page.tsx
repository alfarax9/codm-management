import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/login-form'
import { getUser } from '@/lib/auth/session'

export default async function LoginPage() {
  if (await getUser()) redirect('/dashboard')

  const t = await getTranslations('common')

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('appName')}</CardTitle>
          <CardDescription>
            Masukkan email kamu, lalu buka tautan login yang dikirim ke sana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <LanguageSwitcher />
    </div>
  )
}
