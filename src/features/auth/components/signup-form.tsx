'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp, type ActionState } from '@/features/auth/actions'

export function SignUpForm() {
  const t = useTranslations('auth')
  const [state, action, pending] = useActionState<ActionState, FormData>(signUp, {})

  // Setelah pendaftaran berhasil, formnya diganti pesan — menampilkan kembali
  // field yang sudah diisi hanya mengundang orang menekan daftar dua kali.
  if (state.message) {
    return (
      <Alert>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t('emailPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t('signingUp') : t('signUp')}
      </Button>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link href="/login" className="underline underline-offset-4">
          {t('signIn')}
        </Link>
      </p>
    </form>
  )
}
