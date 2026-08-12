'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionState } from '@/features/auth/actions'
import { createOrg } from '@/features/org/actions'

export function CreateOrgForm() {
  const t = useTranslations('org')
  const [state, action, pending] = useActionState<ActionState, FormData>(createOrg, {})

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t('nameLabel')}</Label>
        <Input id="name" name="name" required placeholder={t('namePlaceholder')} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="teamName">{t('teamNameLabel')}</Label>
        <Input id="teamName" name="teamName" required placeholder={t('teamNamePlaceholder')} />
        <p className="text-xs text-muted-foreground">{t('teamNameHint')}</p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t('creating') : t('createButton')}
      </Button>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
