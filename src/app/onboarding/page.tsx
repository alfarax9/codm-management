import { redirect } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateOrgForm } from '@/features/org/components/create-org-form'
import { getOrgContext, requireUser } from '@/lib/auth/session'

export default async function OnboardingPage() {
  await requireUser()
  if (await getOrgContext()) redirect('/dashboard')

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Buat organisasi</CardTitle>
          <CardDescription>
            Map pool, format scrim, katalog senjata, dan ruleset World Championship 2026 akan
            langsung terisi supaya bisa dipakai hari ini juga.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
    </div>
  )
}
