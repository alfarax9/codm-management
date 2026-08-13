'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useActionState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword, type ActionState } from '@/features/auth/actions'
import { cn } from '@/lib/utils'

export function UpdatePasswordForm() {
  const t = useTranslations('auth')
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePassword, {})

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t('newPasswordLabel')}</Label>
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
        {pending ? t('saving') : t('savePassword')}
      </Button>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.message && (
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
            {t('backToLogin')}
          </Link>
        </div>
      )}
    </form>
  )
}
