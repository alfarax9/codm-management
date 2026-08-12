'use client'

import { useActionState } from 'react'

import { signIn, type ActionState } from '@/features/auth/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, {})

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nama@tim.com"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Mengirim…' : 'Kirim tautan login'}
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
