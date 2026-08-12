import { and, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { withRls } from '@/db/rls'
import { organizations, orgMembers, profiles } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'

export const ORG_COOKIE = 'codm_org'

/** Peran yang boleh mengubah data operasional (map, format, ruleset, roster, scrim). */
const MANAGE_ROLES = ['owner', 'admin', 'coach'] as const
const ADMIN_ROLES = ['owner', 'admin'] as const

export type OrgContext = {
  userId: string
  email: string
  displayName: string | null
  orgId: string
  orgName: string
  role: (typeof orgMembers.$inferSelect)['role']
  /** Semua org yang bisa dipilih user — untuk org switcher. */
  memberships: { id: string; name: string; role: OrgContext['role'] }[]
}

/**
 * `cache` membuat satu request hanya sekali memanggil Supabase dan database,
 * berapa pun komponen server yang membutuhkannya.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Konteks organisasi aktif. Mengembalikan null kalau user belum tergabung
 * di organisasi mana pun — pemanggil yang memutuskan mau redirect ke onboarding.
 */
export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const user = await getUser()
  if (!user) return null

  const rows = await withRls(user.id, (tx) =>
    tx
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        role: orgMembers.role,
        email: profiles.email,
        displayName: profiles.displayName,
      })
      .from(orgMembers)
      .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
      .innerJoin(profiles, eq(profiles.id, orgMembers.userId))
      .where(eq(orgMembers.userId, user.id)),
  )

  if (rows.length === 0) return null

  const cookieStore = await cookies()
  const preferred = cookieStore.get(ORG_COOKIE)?.value
  const active = rows.find((r) => r.orgId === preferred) ?? rows[0]

  return {
    userId: user.id,
    email: active.email,
    displayName: active.displayName,
    orgId: active.orgId,
    orgName: active.orgName,
    role: active.role,
    memberships: rows.map((r) => ({ id: r.orgId, name: r.orgName, role: r.role })),
  }
})

export async function requireOrg(): Promise<OrgContext> {
  await requireUser()
  const ctx = await getOrgContext()
  if (!ctx) redirect('/onboarding')
  return ctx
}

/**
 * Untuk Server Action yang menulis. RLS tetap menjadi penjaga terakhir di
 * database; pengecekan di sini hanya supaya user dapat pesan error yang jelas,
 * bukan baris nol tanpa penjelasan.
 */
export async function requireManageOrg(): Promise<OrgContext> {
  const ctx = await requireOrg()
  if (!(MANAGE_ROLES as readonly string[]).includes(ctx.role)) {
    throw new Error('Kamu tidak punya izin untuk mengubah data ini.')
  }
  return ctx
}

export async function requireOrgAdmin(): Promise<OrgContext> {
  const ctx = await requireOrg()
  if (!(ADMIN_ROLES as readonly string[]).includes(ctx.role)) {
    throw new Error('Hanya pemilik atau admin organisasi yang boleh melakukan ini.')
  }
  return ctx
}

/** Verifikasi user memang anggota org tertentu — dipakai saat berganti org. */
export async function isMemberOf(userId: string, orgId: string) {
  const rows = await withRls(userId, (tx) =>
    tx
      .select({ orgId: orgMembers.orgId })
      .from(orgMembers)
      .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
      .limit(1),
  )
  return rows.length > 0
}
