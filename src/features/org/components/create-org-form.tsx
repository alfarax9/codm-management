'use client'

import { useActionState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionState } from '@/features/auth/actions'
import { createOrg } from '@/features/org/actions'

export function CreateOrgForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createOrg, {})

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama organisasi</Label>
        <Input id="name" name="name" required placeholder="ACE Esports" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="teamName">Nama roster pertama</Label>
        <Input id="teamName" name="teamName" required placeholder="ACE Main" />
        <p className="text-xs text-muted-foreground">
          Roster lain (academy, dsb) bisa ditambah nanti dari Pengaturan.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Menyiapkan…' : 'Buat organisasi'}
      </Button>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
