import type { RuleScope, RuleValue } from '@/types/domain'

import { normalizeItemKey } from './normalize'

/** Bentuk aturan yang dibutuhkan validator — sengaja lepas dari tipe baris database. */
export type Rule = {
  category: string
  restriction: 'ban' | 'allow'
  itemKey: string
  itemLabel: string
  scope: RuleScope
  value?: RuleValue | null
}

/**
 * Ruleset yang sudah diindeks. Dikompilasi sekali per request lalu dipakai untuk
 * memvalidasi lima loadout sekaligus — tanpa ini tiap pengecekan item akan
 * memindai seluruh daftar aturan.
 */
export type CompiledRuleset = {
  /** category → itemKey → aturan (bisa lebih dari satu kalau scope-nya beda). */
  bans: Map<string, Map<string, Rule[]>>
  /** category → himpunan item yang diizinkan; kategori yang tidak ada di sini tidak pakai allowlist. */
  allowlists: Map<string, Set<string>>
  /** Label asli untuk pesan error, mis. "Molotov Cocktail". */
  labels: Map<string, string>
  gameplaySettings: Map<string, RuleValue>
}

export function compileRuleset(rules: readonly Rule[]): CompiledRuleset {
  const bans = new Map<string, Map<string, Rule[]>>()
  const allowlists = new Map<string, Set<string>>()
  const labels = new Map<string, string>()
  const gameplaySettings = new Map<string, RuleValue>()

  for (const rule of rules) {
    const key = normalizeItemKey(rule.itemKey || rule.itemLabel)
    labels.set(`${rule.category}:${key}`, rule.itemLabel)

    if (rule.category === 'gameplay_setting') {
      if (rule.value) gameplaySettings.set(rule.scope.modeCode ?? key, rule.value)
      continue
    }

    if (rule.restriction === 'allow') {
      let set = allowlists.get(rule.category)
      if (!set) allowlists.set(rule.category, (set = new Set()))
      set.add(key)
      continue
    }

    let byKey = bans.get(rule.category)
    if (!byKey) bans.set(rule.category, (byKey = new Map()))
    byKey.set(key, [...(byKey.get(key) ?? []), rule])
  }

  return { bans, allowlists, labels, gameplaySettings }
}

/** Konteks senjata yang dipakai untuk mencocokkan scope attachment. */
export type ScopeContext = {
  weaponName?: string
  weaponClass?: string
  perkSlot?: 'red' | 'green' | 'blue'
}

/** Aturan tanpa scope berlaku universal; yang ber-scope hanya berlaku kalau konteksnya cocok. */
export function scopeMatches(scope: RuleScope, ctx: ScopeContext): boolean {
  if (scope.weaponName && normalizeItemKey(scope.weaponName) !== normalizeItemKey(ctx.weaponName ?? '')) {
    return false
  }
  if (scope.weaponClass && scope.weaponClass !== ctx.weaponClass) return false
  if (scope.perkSlot && scope.perkSlot !== ctx.perkSlot) return false
  return true
}

/** Aturan ban pertama yang cocok untuk sebuah item, atau null kalau item itu bebas. */
export function findBan(
  compiled: CompiledRuleset,
  category: string,
  itemName: string,
  ctx: ScopeContext = {},
): Rule | null {
  const candidates = compiled.bans.get(category)?.get(normalizeItemKey(itemName))
  return candidates?.find((rule) => scopeMatches(rule.scope, ctx)) ?? null
}

/**
 * Untuk kategori ber-allowlist (operator skill, scorestreak): true kalau item
 * TIDAK ada di daftar yang diizinkan. Kategori tanpa allowlist selalu false.
 */
export function isOutsideAllowlist(
  compiled: CompiledRuleset,
  category: string,
  itemName: string,
): boolean {
  const allowed = compiled.allowlists.get(category)
  return allowed ? !allowed.has(normalizeItemKey(itemName)) : false
}
