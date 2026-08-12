import type { Violation } from '@/types/domain'

import { type CompiledRuleset, findBan, isOutsideAllowlist, type ScopeContext } from './ruleset'

/**
 * Loadout yang id-nya sudah di-resolve jadi nama. Validator sengaja bekerja pada
 * bentuk ini, bukan pada baris database, supaya bisa dijalankan di client sambil
 * user mengetik — tanpa round-trip ke server.
 */
export type ResolvedLoadout = {
  playerId: string
  playerIgn: string
  weapon: { id: string; name: string; class: string } | null
  attachments: { id: string; name: string }[]
  perks: { id: string; name: string; slot: 'red' | 'green' | 'blue' }[]
  lethal: { id: string; name: string } | null
  tactical: { id: string; name: string } | null
  operatorSkill: { id: string; name: string } | null
  scorestreaks: { id: string; name: string }[]
}

/**
 * Cek satu loadout terhadap ruleset. Hasilnya dipakai UI untuk mewarnai merah
 * item yang melanggar; `path` menunjuk field mana yang harus ditandai.
 */
export function validateLoadout(
  loadout: ResolvedLoadout,
  ruleset: CompiledRuleset,
): Violation[] {
  const violations: Violation[] = []
  const weaponCtx: ScopeContext = {
    weaponName: loadout.weapon?.name,
    weaponClass: loadout.weapon?.class,
  }

  const banned = (
    category: string,
    itemName: string,
    path: string,
    ctx: ScopeContext = weaponCtx,
  ): void => {
    const rule = findBan(ruleset, category, itemName, ctx)
    if (!rule) return
    violations.push({
      severity: 'banned',
      category,
      itemLabel: itemName,
      reasonKey: 'violation.banned',
      reasonParams: { item: itemName, category },
      path,
    })
  }

  const outsideAllowlist = (category: string, itemName: string, path: string): void => {
    if (!isOutsideAllowlist(ruleset, category, itemName)) return
    violations.push({
      severity: 'banned',
      category,
      itemLabel: itemName,
      reasonKey: 'violation.notAllowlisted',
      reasonParams: { item: itemName, category },
      path,
    })
  }

  if (loadout.weapon) banned('weapon', loadout.weapon.name, 'weapon')

  loadout.attachments.forEach((a, i) => banned('attachment', a.name, `attachments[${i}]`))

  loadout.perks.forEach((p, i) =>
    banned('perk', p.name, `perks[${i}]`, { ...weaponCtx, perkSlot: p.slot }),
  )

  if (loadout.lethal) banned('lethal', loadout.lethal.name, 'lethal')
  if (loadout.tactical) banned('tactical', loadout.tactical.name, 'tactical')

  if (loadout.operatorSkill) {
    banned('operator_skill', loadout.operatorSkill.name, 'operatorSkill')
    outsideAllowlist('operator_skill', loadout.operatorSkill.name, 'operatorSkill')
  }

  loadout.scorestreaks.forEach((s, i) => {
    banned('scorestreak', s.name, `scorestreaks[${i}]`)
    outsideAllowlist('scorestreak', s.name, `scorestreaks[${i}]`)
  })

  return violations
}

/**
 * Aturan "Unique Operator Skills": dalam satu match, tidak boleh ada dua pemain
 * se-tim memakai operator skill yang sama. Melanggar = dianggap memakai skill itu,
 * jadi kedua pemain ditandai, bukan hanya yang kedua.
 */
export function validateUniqueOperatorSkills(
  loadouts: readonly ResolvedLoadout[],
): Map<string, Violation[]> {
  const byPlayer = new Map<string, Violation[]>()
  const holders = new Map<string, ResolvedLoadout[]>()

  for (const loadout of loadouts) {
    const skill = loadout.operatorSkill
    if (!skill) continue
    holders.set(skill.id, [...(holders.get(skill.id) ?? []), loadout])
  }

  for (const group of holders.values()) {
    if (group.length < 2) continue
    const others = group.map((l) => l.playerIgn)
    for (const loadout of group) {
      const violation: Violation = {
        severity: 'banned',
        category: 'operator_skill',
        itemLabel: loadout.operatorSkill?.name ?? '',
        reasonKey: 'violation.duplicateOperatorSkill',
        reasonParams: {
          skill: loadout.operatorSkill?.name ?? '',
          players: others.filter((ign) => ign !== loadout.playerIgn).join(', '),
        },
        path: 'operatorSkill',
      }
      byPlayer.set(loadout.playerId, [...(byPlayer.get(loadout.playerId) ?? []), violation])
    }
  }

  return byPlayer
}

export type ClassRole = 'AR' | 'SMG' | 'LMG' | 'Shotgun' | 'Marksman' | 'Sniper'

/** Pool default menurut ruleset World Championship 2026: 5 pemain × 2 role. */
export const DEFAULT_CLASS_ROLE_POOL: Record<ClassRole, number> = {
  AR: 3,
  SMG: 3,
  LMG: 1,
  Shotgun: 1,
  Marksman: 1,
  Sniper: 1,
}

export type ClassRoleIssue =
  | { type: 'count_mismatch'; role: ClassRole; declared: number; required: number }
  | { type: 'wrong_role_count'; playerId: string; playerIgn: string; declared: number; required: number }

/**
 * Cek pool weapon class role satu tim. Dua hal diperiksa: tiap pemain mendeklarasikan
 * jumlah role yang benar, dan total per role persis sesuai pool.
 */
export function validateClassRolePool(
  claims: readonly { playerId: string; playerIgn: string; roles: ClassRole[] }[],
  pool: Record<ClassRole, number> = DEFAULT_CLASS_ROLE_POOL,
  rolesPerPlayer = 2,
): ClassRoleIssue[] {
  const issues: ClassRoleIssue[] = []
  const counts = new Map<ClassRole, number>()

  for (const claim of claims) {
    if (claim.roles.length !== rolesPerPlayer) {
      issues.push({
        type: 'wrong_role_count',
        playerId: claim.playerId,
        playerIgn: claim.playerIgn,
        declared: claim.roles.length,
        required: rolesPerPlayer,
      })
    }
    for (const role of claim.roles) counts.set(role, (counts.get(role) ?? 0) + 1)
  }

  for (const [role, required] of Object.entries(pool) as [ClassRole, number][]) {
    const declared = counts.get(role) ?? 0
    if (declared !== required) {
      issues.push({ type: 'count_mismatch', role, declared, required })
    }
  }

  return issues
}
