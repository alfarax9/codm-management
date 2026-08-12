'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { withRls } from '@/db/rls'
import { organizations, orgMembers, teams } from '@/db/schema'
import { seedOrgReference } from '@/db/seed/seed-org'
import type { ActionState } from '@/features/auth/actions'
import { ORG_COOKIE, requireUser } from '@/lib/auth/session'

const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Nama organisasi minimal 2 karakter.').max(60),
  teamName: z.string().trim().min(2, 'Nama roster minimal 2 karakter.').max(60),
})

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Membuat organisasi beserta roster pertama, lalu mengisi data referensi
 * (mode, format scrim, map pool, katalog, ruleset WC 2026).
 *
 * Semuanya dalam satu transaksi: kalau seed gagal, organisasi setengah jadi
 * tidak tertinggal di database.
 */
export async function createOrg(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()

  const parsed = createOrgSchema.safeParse({
    name: formData.get('name'),
    teamName: formData.get('teamName'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, teamName } = parsed.data
  // Slug dibuat unik dengan sufiks acak; nama organisasi boleh sama.
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`

  let orgId: string
  try {
    orgId = await withRls(user.id, async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ name, slug, ownerId: user.id })
        .returning({ id: organizations.id })

      await tx.insert(orgMembers).values({ orgId: org.id, userId: user.id, role: 'owner' })
      await tx.insert(teams).values({ orgId: org.id, name: teamName })
      await seedOrgReference(tx, org.id, user.id)

      return org.id
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Gagal membuat organisasi.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(ORG_COOKIE, orgId, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
