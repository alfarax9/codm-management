import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/login-form'
import { getUser } from '@/lib/auth/session'

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  if (await getUser()) redirect('/dashboard')

  const [tCommon, tAuth, params] = await Promise.all([
    getTranslations('common'),
    getTranslations('auth'),
    searchParams,
  ])

  const error = typeof params.error === 'string' ? params.error : null

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{tCommon('appName')}</CardTitle>
          <CardDescription>{tAuth('loginDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Pesan asli dari Supabase ditampilkan apa adanya — tanpa ini,
              kegagalan callback tidak bisa dibedakan dari tautan kedaluwarsa. */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <LoginForm />
        </CardContent>
      </Card>
      <LanguageSwitcher />
    </div>
  )
}
