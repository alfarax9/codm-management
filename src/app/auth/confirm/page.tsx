import type { EmailOtpType } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { confirmEmailLink } from '@/features/auth/actions'

const str = (v: string | string[] | undefined): string | null => (typeof v === 'string' ? v : null)

/**
 * Tujuan tautan verifikasi dari email (pendaftaran, reset kata sandi).
 *
 * Verifikasi SENGAJA tidak langsung dijalankan saat halaman ini dibuka — baru
 * terjadi setelah form di bawah disubmit. `token_hash` sekali pakai, dan
 * penyedia email (Gmail dkk.) memindai tautan secara otomatis lewat GET sebelum
 * penggunanya sendiri membuka email itu, sehingga token habis sebelum sempat
 * diklik. Pemindai tidak pernah mengisi dan mengirim form, jadi token tetap
 * utuh sampai ada klik sungguhan.
 */
export default async function ConfirmPage({ searchParams }: PageProps<'/auth/confirm'>) {
  const params = await searchParams
  const t = await getTranslations('auth')

  const tokenHash = str(params.token_hash)
  const type = str(params.type) as EmailOtpType | null
  const next = str(params.next)
  const supabaseError = str(params.error_description) ?? str(params.error)

  const incomplete = !tokenHash || !type

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('confirmTitle')}</CardTitle>
          <CardDescription>{t('confirmDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {supabaseError || incomplete ? (
            <Alert variant="destructive">
              <AlertDescription>{supabaseError ?? t('messages.incompleteLink')}</AlertDescription>
            </Alert>
          ) : (
            <form action={confirmEmailLink} className="flex flex-col gap-3">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              {next && <input type="hidden" name="next" value={next} />}
              <p className="text-xs text-muted-foreground">{t('confirmHint')}</p>
              <Button type="submit">{t('confirmButton')}</Button>
            </form>
          )}
        </CardContent>
      </Card>
      <LanguageSwitcher />
    </div>
  )
}
