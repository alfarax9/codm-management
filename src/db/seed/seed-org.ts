import { and, eq } from 'drizzle-orm'

import { buildFormatCode } from '@/lib/rules/format'
import { normalizeItemKey } from '@/lib/rules/normalize'

import type { Tx } from '../rls'
import {
  attachments,
  mapModes,
  maps,
  modes,
  operatorSkills,
  perks,
  rulesetMapPool,
  rulesetRules,
  rulesets,
  scorestreaks,
  seriesFormats,
  utilities,
  weapons,
} from '../schema'
import {
  MODE_ORDER,
  quotaFromCode,
  SERIES_FORMAT_CODES,
  WC2026_ALLOWED_OPERATOR_SKILLS,
  WC2026_ALLOWED_SCORESTREAKS,
  WC2026_BANNED_ATTACHMENTS,
  WC2026_BANNED_COSMETICS,
  WC2026_BANNED_LETHALS,
  WC2026_BANNED_PERKS,
  WC2026_BANNED_TACTICALS,
  WC2026_BANNED_WEAPONS,
  WC2026_CLASS_ROLE_POOL,
  WC2026_GAMEPLAY_SETTINGS,
  WC2026_MAP_POOL,
} from './reference'

const RULESET_NAME = 'World Championship 2026'

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Mengisi data referensi sebuah organisasi: format scrim, map pool, katalog item,
 * dan ruleset World Championship 2026 sebagai titik awal.
 *
 * Dipanggil saat organisasi dibuat lewat aplikasi, dan juga oleh `npm run db:seed`
 * untuk organisasi yang sudah terlanjur ada. Aman dijalankan berulang.
 *
 * Mode TIDAK ikut diisi di sini — datanya global dan dipasang lewat migrasi
 * `0004_seed_modes.sql`. Selain karena bukan milik organisasi, `modes.sort_order`
 * menentukan arti kode format scrim, jadi tidak boleh bisa ditulis dari aplikasi.
 */
export async function seedOrgReference(tx: Tx, orgId: string, createdBy?: string) {
  const modeRows = await tx.select().from(modes)
  if (modeRows.length === 0) {
    throw new Error('Tabel modes kosong — jalankan `npm run db:migrate` lebih dulu.')
  }
  const modeIdByCode = new Map(modeRows.map((m) => [m.code, m.id]))

  await tx
    .insert(seriesFormats)
    .values(
      SERIES_FORMAT_CODES.map((code) => {
        const modeQuota = quotaFromCode(code)
        return {
          orgId,
          code: buildFormatCode(modeQuota, [...MODE_ORDER]),
          modeQuota,
          gamesCount: Object.values(modeQuota).reduce((a, b) => a + b, 0),
          createdBy: createdBy ?? null,
        }
      }),
    )
    .onConflictDoNothing()

  const mapNames = [...new Set(Object.values(WC2026_MAP_POOL).flat())]
  await tx
    .insert(maps)
    .values(
      mapNames.map((name) => ({ orgId, name, slug: slugify(name), uploadedBy: createdBy ?? null })),
    )
    .onConflictDoNothing()

  const mapRows = await tx.select().from(maps).where(eq(maps.orgId, orgId))
  const mapIdByName = new Map(mapRows.map((m) => [m.name, m.id]))

  const mapModeRows = Object.entries(WC2026_MAP_POOL).flatMap(([modeCode, names]) =>
    names.flatMap((name) => {
      const mapId = mapIdByName.get(name)
      const modeId = modeIdByCode.get(modeCode)
      return mapId && modeId ? [{ mapId, modeId }] : []
    }),
  )
  await tx.insert(mapModes).values(mapModeRows).onConflictDoNothing()

  // Senjata yang disebut di daftar ban attachment ikut didaftarkan supaya scope
  // `weaponName` punya pasangan di katalog.
  const weaponClasses = new Map<string, string>()
  for (const w of WC2026_BANNED_WEAPONS) weaponClasses.set(w.name, w.class)
  for (const a of WC2026_BANNED_ATTACHMENTS) {
    if (a.weapon && !weaponClasses.has(a.weapon)) weaponClasses.set(a.weapon, 'AR')
  }

  await tx
    .insert(weapons)
    .values(
      [...weaponClasses].map(([name, cls]) => ({
        orgId,
        name,
        class: cls as (typeof WC2026_BANNED_WEAPONS)[number]['class'],
      })),
    )
    .onConflictDoNothing()

  const weaponRows = await tx.select().from(weapons).where(eq(weapons.orgId, orgId))
  const weaponIdByName = new Map(weaponRows.map((w) => [w.name, w.id]))

  await tx
    .insert(attachments)
    .values(
      WC2026_BANNED_ATTACHMENTS.map((a) => ({
        orgId,
        name: a.name,
        weaponId: a.weapon ? (weaponIdByName.get(a.weapon) ?? null) : null,
      })),
    )
    .onConflictDoNothing()

  await tx
    .insert(perks)
    .values(WC2026_BANNED_PERKS.map((p) => ({ orgId, slot: p.slot, name: p.name })))
    .onConflictDoNothing()

  await tx
    .insert(utilities)
    .values([
      ...WC2026_BANNED_LETHALS.map((name) => ({ orgId, type: 'lethal' as const, name })),
      ...WC2026_BANNED_TACTICALS.map((name) => ({ orgId, type: 'tactical' as const, name })),
    ])
    .onConflictDoNothing()

  await tx
    .insert(operatorSkills)
    .values(WC2026_ALLOWED_OPERATOR_SKILLS.map((name) => ({ orgId, name })))
    .onConflictDoNothing()

  await tx
    .insert(scorestreaks)
    .values(WC2026_ALLOWED_SCORESTREAKS.map((name) => ({ orgId, name })))
    .onConflictDoNothing()

  const [existing] = await tx
    .select({ id: rulesets.id })
    .from(rulesets)
    .where(and(eq(rulesets.orgId, orgId), eq(rulesets.name, RULESET_NAME)))
    .limit(1)

  if (existing) return { rulesetId: existing.id, created: false }

  const [ruleset] = await tx
    .insert(rulesets)
    .values({
      orgId,
      name: RULESET_NAME,
      sourceType: 'manual',
      status: 'active',
      effectiveFrom: new Date(),
      createdBy: createdBy ?? null,
    })
    .returning({ id: rulesets.id })

  const rule = (
    category: (typeof rulesetRules.$inferInsert)['category'],
    itemLabel: string,
    restriction: 'ban' | 'allow' = 'ban',
    scope: (typeof rulesetRules.$inferInsert)['scope'] = {},
    value?: (typeof rulesetRules.$inferInsert)['value'],
  ): typeof rulesetRules.$inferInsert => ({
    rulesetId: ruleset.id,
    category,
    restriction,
    itemKey: normalizeItemKey(itemLabel),
    itemLabel,
    scope,
    value: value ?? null,
  })

  await tx.insert(rulesetRules).values([
    ...WC2026_BANNED_WEAPONS.map((w) => rule('weapon', w.name)),
    ...WC2026_BANNED_ATTACHMENTS.map((a) =>
      rule('attachment', a.name, 'ban', {
        ...(a.weapon ? { weaponName: a.weapon } : {}),
        ...(a.weaponClass ? { weaponClass: a.weaponClass } : {}),
      }),
    ),
    ...WC2026_BANNED_PERKS.map((p) => rule('perk', p.name, 'ban', { perkSlot: p.slot })),
    ...WC2026_BANNED_LETHALS.map((n) => rule('lethal', n)),
    ...WC2026_BANNED_TACTICALS.map((n) => rule('tactical', n)),
    ...WC2026_ALLOWED_OPERATOR_SKILLS.map((n) => rule('operator_skill', n, 'allow')),
    ...WC2026_ALLOWED_SCORESTREAKS.map((n) => rule('scorestreak', n, 'allow')),
    ...WC2026_BANNED_COSMETICS.map((n) => rule('cosmetic', n)),
    rule('wildcard', 'All Wildcards'),
    ...Object.entries(WC2026_GAMEPLAY_SETTINGS).map(([modeCode, settings]) =>
      rule('gameplay_setting', `Lobby — ${modeCode.toUpperCase()}`, 'ban', { modeCode }, settings),
    ),
    ...Object.entries(WC2026_CLASS_ROLE_POOL).map(([role, count]) =>
      rule('class_role', role, 'allow', {}, { count }),
    ),
  ])

  await tx
    .insert(rulesetMapPool)
    .values(mapModeRows.map(({ mapId, modeId }) => ({ rulesetId: ruleset.id, mapId, modeId })))
    .onConflictDoNothing()

  return { rulesetId: ruleset.id, created: true }
}
