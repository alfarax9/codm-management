'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset, type ActionState } from '@/features/auth/actions'

export function ForgotPasswordForm() {
  const t = useTranslations('auth')
  const [state, action, pending] = useActionState<ActionState, FormData>(requestPasswordReset, {})

  if (state.message) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
        <Link href="/login" className="text-center text-sm underline underline-offset-4">
          {t('backToLogin')}
        </Link>
      </div>
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

      <Button type="submit" disabled={pending}>
        {pending ? t('sending') : t('sendResetLink')}
      </Button>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Link href="/login" className="text-center text-sm underline underline-offset-4">
        {t('backToLogin')}
      </Link>
    </form>
  )
}
