import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UpdatePasswordForm } from '@/features/auth/components/update-password-form'
import { requireUser } from '@/lib/auth/session'

/**
 * Sengaja di luar grup `(app)`: layout grup itu mewajibkan organisasi aktif,
 * sedangkan halaman ini juga menjadi tujuan tautan reset kata sandi — yang bisa
 * dibuka orang yang belum tergabung di organisasi mana pun.
 */
export default async function ChangePasswordPage() {
  await requireUser()
  const t = await getTranslations('auth')

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('changePasswordTitle')}</CardTitle>
          <CardDescription>{t('changePasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
      <LanguageSwitcher />
    </div>
  )
}
