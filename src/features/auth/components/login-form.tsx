'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, type ActionState } from '@/features/auth/actions'

export function LoginForm() {
  const t = useTranslations('auth')
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, {})

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
        {pending ? t('sending') : t('sendMagicLink')}
      </Button>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.message && (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
