import 'dotenv/config'
import { and, eq } from 'drizzle-orm'

import { buildFormatCode } from '@/lib/rules/format'
import { normalizeItemKey } from '@/lib/rules/normalize'

import { db } from '..'
import {
  attachments,
  mapModes,
  maps,
  modes,
  operatorSkills,
  organizations,
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
  MODES,
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

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Mengisi data referensi untuk satu organisasi: mode, format scrim, map pool,
 * katalog senjata/perk/utility, dan ruleset World Championship 2026.
 *
 *   npm run db:seed -- <org-id>
 *
 * Aman dijalankan berulang — semua insert memakai `onConflictDoNothing`,
 * kecuali ruleset yang dibuat ulang kalau namanya belum ada.
 */
async function seed(orgId: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1)
  if (!org) throw new Error(`Organisasi ${orgId} tidak ditemukan. Buat dulu lewat aplikasi.`)

  console.log(`Seeding untuk organisasi "${org.name}"…`)

  // --- Mode (global, bukan per org) ---------------------------------------
  await db
    .insert(modes)
    .values(MODES.map((m) => ({ ...m, statColumns: [...m.statColumns] })))
    .onConflictDoNothing({ target: modes.code })

  const modeRows = await db.select().from(modes)
  const modeIdByCode = new Map(modeRows.map((m) => [m.code, m.id]))

  // --- Format scrim --------------------------------------------------------
  await db
    .insert(seriesFormats)
    .values(
      SERIES_FORMAT_CODES.map((code) => {
        const modeQuota = quotaFromCode(code)
        return {
          orgId,
          code: buildFormatCode(modeQuota, [...MODE_ORDER]),
          modeQuota,
          gamesCount: Object.values(modeQuota).reduce((a, b) => a + b, 0),
        }
      }),
    )
    .onConflictDoNothing()

  // --- Map + relasi mode ---------------------------------------------------
  const mapNames = [...new Set(Object.values(WC2026_MAP_POOL).flat())]
  await db
    .insert(maps)
    .values(mapNames.map((name) => ({ orgId, name, slug: slugify(name) })))
    .onConflictDoNothing()

  const mapRows = await db.select().from(maps).where(eq(maps.orgId, orgId))
  const mapIdByName = new Map(mapRows.map((m) => [m.name, m.id]))

  const mapModeRows = Object.entries(WC2026_MAP_POOL).flatMap(([modeCode, names]) =>
    names.flatMap((name) => {
      const mapId = mapIdByName.get(name)
      const modeId = modeIdByCode.get(modeCode)
      return mapId && modeId ? [{ mapId, modeId }] : []
    }),
  )
  await db.insert(mapModes).values(mapModeRows).onConflictDoNothing()

  // --- Katalog item --------------------------------------------------------
  // Senjata yang muncul di daftar ban attachment ikut didaftarkan supaya
  // scope `weaponName` punya pasangan di katalog.
  const weaponNames = new Map<string, string>()
  for (const w of WC2026_BANNED_WEAPONS) weaponNames.set(w.name, w.class)
  for (const a of WC2026_BANNED_ATTACHMENTS) {
    if (a.weapon && !weaponNames.has(a.weapon)) weaponNames.set(a.weapon, 'AR')
  }

  await db
    .insert(weapons)
    .values(
      [...weaponNames].map(([name, cls]) => ({
        orgId,
        name,
        class: cls as (typeof WC2026_BANNED_WEAPONS)[number]['class'],
      })),
    )
    .onConflictDoNothing()

  const weaponRows = await db.select().from(weapons).where(eq(weapons.orgId, orgId))
  const weaponIdByName = new Map(weaponRows.map((w) => [w.name, w.id]))

  await db
    .insert(attachments)
    .values(
      WC2026_BANNED_ATTACHMENTS.map((a) => ({
        orgId,
        name: a.name,
        weaponId: a.weapon ? (weaponIdByName.get(a.weapon) ?? null) : null,
      })),
    )
    .onConflictDoNothing()

  await db
    .insert(perks)
    .values(WC2026_BANNED_PERKS.map((p) => ({ orgId, slot: p.slot, name: p.name })))
    .onConflictDoNothing()

  await db
    .insert(utilities)
    .values([
      ...WC2026_BANNED_LETHALS.map((name) => ({ orgId, type: 'lethal' as const, name })),
      ...WC2026_BANNED_TACTICALS.map((name) => ({ orgId, type: 'tactical' as const, name })),
    ])
    .onConflictDoNothing()

  await db
    .insert(operatorSkills)
    .values(WC2026_ALLOWED_OPERATOR_SKILLS.map((name) => ({ orgId, name })))
    .onConflictDoNothing()

  await db
    .insert(scorestreaks)
    .values(WC2026_ALLOWED_SCORESTREAKS.map((name) => ({ orgId, name })))
    .onConflictDoNothing()

  // --- Ruleset WC 2026 -----------------------------------------------------
  const rulesetName = 'World Championship 2026'
  const [existing] = await db
    .select({ id: rulesets.id })
    .from(rulesets)
    .where(and(eq(rulesets.orgId, orgId), eq(rulesets.name, rulesetName)))
    .limit(1)

  if (existing) {
    console.log(`Ruleset "${rulesetName}" sudah ada — dilewati.`)
    console.log('Selesai.')
    return
  }

  const [ruleset] = await db
    .insert(rulesets)
    .values({
      orgId,
      name: rulesetName,
      sourceType: 'manual',
      status: 'active',
      effectiveFrom: new Date(),
    })
    .returning({ id: rulesets.id })

  const rule = (
    category: string,
    itemLabel: string,
    restriction: 'ban' | 'allow',
    scope: Record<string, unknown> = {},
    value?: Record<string, number | boolean>,
  ) => ({
    rulesetId: ruleset.id,
    category: category as 'weapon',
    restriction,
    itemKey: normalizeItemKey(itemLabel),
    itemLabel,
    scope: scope as Record<string, never>,
    value: value ?? null,
  })

  await db.insert(rulesetRules).values([
    ...WC2026_BANNED_WEAPONS.map((w) => rule('weapon', w.name, 'ban')),
    ...WC2026_BANNED_ATTACHMENTS.map((a) =>
      rule('attachment', a.name, 'ban', {
        ...(a.weapon ? { weaponName: a.weapon } : {}),
        ...(a.weaponClass ? { weaponClass: a.weaponClass } : {}),
      }),
    ),
    ...WC2026_BANNED_PERKS.map((p) => rule('perk', p.name, 'ban', { perkSlot: p.slot })),
    ...WC2026_BANNED_LETHALS.map((n) => rule('lethal', n, 'ban')),
    ...WC2026_BANNED_TACTICALS.map((n) => rule('tactical', n, 'ban')),
    ...WC2026_ALLOWED_OPERATOR_SKILLS.map((n) => rule('operator_skill', n, 'allow')),
    ...WC2026_ALLOWED_SCORESTREAKS.map((n) => rule('scorestreak', n, 'allow')),
    ...WC2026_BANNED_COSMETICS.map((n) => rule('cosmetic', n, 'ban')),
    rule('wildcard', 'All Wildcards', 'ban'),
    ...Object.entries(WC2026_GAMEPLAY_SETTINGS).map(([modeCode, settings]) =>
      rule('gameplay_setting', `Lobby settings — ${modeCode.toUpperCase()}`, 'ban', { modeCode }, settings),
    ),
    ...Object.entries(WC2026_CLASS_ROLE_POOL).map(([role, count]) =>
      rule('class_role', role, 'allow', {}, { count }),
    ),
  ])

  await db
    .insert(rulesetMapPool)
    .values(
      mapModeRows.map(({ mapId, modeId }) => ({ rulesetId: ruleset.id, mapId, modeId })),
    )
    .onConflictDoNothing()

  console.log('Selesai.')
}

const orgId = process.argv[2]
if (!orgId) {
  console.error('Pemakaian: npm run db:seed -- <org-id>')
  process.exit(1)
}

seed(orgId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
