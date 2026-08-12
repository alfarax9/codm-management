import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  type ResolvedLoadout,
  validateClassRolePool,
  validateLoadout,
  validateUniqueOperatorSkills,
} from './loadout'
import { normalizeItemKey } from './normalize'
import { compileRuleset, type Rule } from './ruleset'

const rule = (
  category: string,
  itemLabel: string,
  restriction: 'ban' | 'allow' = 'ban',
  scope: Rule['scope'] = {},
): Rule => ({ category, restriction, itemKey: normalizeItemKey(itemLabel), itemLabel, scope })

/** Cuplikan ruleset World Championship 2026. */
const RULESET = compileRuleset([
  rule('weapon', 'Argus'),
  rule('attachment', 'Akimbo'),
  rule('attachment', 'Slug Ammo', 'ban', { weaponClass: 'Shotgun' }),
  rule('attachment', 'Bipod', 'ban', { weaponName: '3-Line Rifle' }),
  rule('perk', 'Martyrdom', 'ban', { perkSlot: 'red' }),
  rule('lethal', 'Molotov Cocktail'),
  rule('operator_skill', 'Annihilator', 'allow'),
  rule('operator_skill', 'Purifier', 'allow'),
  rule('scorestreak', 'EMP', 'allow'),
])

const loadout = (patch: Partial<ResolvedLoadout> = {}): ResolvedLoadout => ({
  playerId: 'p1',
  playerIgn: 'Jakun',
  weapon: { id: 'w1', name: 'AK117', class: 'AR' },
  attachments: [],
  perks: [],
  lethal: null,
  tactical: null,
  operatorSkill: null,
  scorestreaks: [],
  ...patch,
})

describe('validasi loadout', () => {
  it('loadout bersih tidak menghasilkan pelanggaran', () => {
    const result = validateLoadout(
      loadout({
        operatorSkill: { id: 'os1', name: 'Purifier' },
        scorestreaks: [{ id: 's1', name: 'EMP' }],
      }),
      RULESET,
    )
    assert.deepEqual(result, [])
  })

  it('menandai senjata yang dilarang', () => {
    const result = validateLoadout(
      loadout({ weapon: { id: 'w2', name: 'Argus', class: 'Shotgun' } }),
      RULESET,
    )
    assert.equal(result.length, 1)
    assert.equal(result[0].path, 'weapon')
    assert.equal(result[0].category, 'weapon')
  })

  it('menandai attachment global di senjata apa pun', () => {
    const result = validateLoadout(
      loadout({ attachments: [{ id: 'a1', name: 'Akimbo' }] }),
      RULESET,
    )
    assert.equal(result[0].path, 'attachments[0]')
  })

  it('attachment ber-scope senjata hanya berlaku di senjata itu', () => {
    const onOtherWeapon = validateLoadout(
      loadout({ attachments: [{ id: 'a2', name: 'Bipod' }] }),
      RULESET,
    )
    assert.deepEqual(onOtherWeapon, [])

    const onScopedWeapon = validateLoadout(
      loadout({
        weapon: { id: 'w3', name: '3-Line Rifle', class: 'Marksman' },
        attachments: [{ id: 'a2', name: 'Bipod' }],
      }),
      RULESET,
    )
    assert.equal(onScopedWeapon.length, 1)
  })

  it('attachment ber-scope kelas berlaku untuk seluruh kelas itu', () => {
    const result = validateLoadout(
      loadout({
        weapon: { id: 'w4', name: 'BY15', class: 'Shotgun' },
        attachments: [{ id: 'a3', name: 'Slug Ammo' }],
      }),
      RULESET,
    )
    assert.equal(result.length, 1)
    assert.equal(result[0].itemLabel, 'Slug Ammo')
  })

  it('perk hanya dilarang di slot yang disebutkan', () => {
    const inRedSlot = validateLoadout(
      loadout({ perks: [{ id: 'pk1', name: 'Martyrdom', slot: 'red' }] }),
      RULESET,
    )
    assert.equal(inRedSlot.length, 1)

    const inBlueSlot = validateLoadout(
      loadout({ perks: [{ id: 'pk1', name: 'Martyrdom', slot: 'blue' }] }),
      RULESET,
    )
    assert.deepEqual(inBlueSlot, [])
  })

  it('mencocokkan nama meski ejaannya berbeda', () => {
    // Dokumen sumber menulis " Molotov Cocktail" dengan spasi di depan.
    const result = validateLoadout(
      loadout({ lethal: { id: 'l1', name: '  molotov   cocktail ' } }),
      RULESET,
    )
    assert.equal(result.length, 1)
  })

  it('menandai item di luar allowlist', () => {
    const result = validateLoadout(
      loadout({ operatorSkill: { id: 'os9', name: 'Katana' } }),
      RULESET,
    )
    assert.equal(result.length, 1)
    assert.equal(result[0].reasonKey, 'violation.notAllowlisted')
  })
})

describe('operator skill unik per tim', () => {
  it('menandai kedua pemain yang memakai skill sama', () => {
    const skill = { id: 'os1', name: 'Purifier' }
    const result = validateUniqueOperatorSkills([
      loadout({ playerId: 'p1', playerIgn: 'Jakun', operatorSkill: skill }),
      loadout({ playerId: 'p2', playerIgn: 'Arsek', operatorSkill: skill }),
      loadout({ playerId: 'p3', playerIgn: 'Smg', operatorSkill: { id: 'os2', name: 'Sparrow' } }),
    ])
    assert.deepEqual([...result.keys()].sort(), ['p1', 'p2'])
    assert.match(result.get('p1')?.[0].reasonParams?.players as string, /Arsek/)
  })

  it('skill yang berbeda tidak dipermasalahkan', () => {
    const result = validateUniqueOperatorSkills([
      loadout({ playerId: 'p1', operatorSkill: { id: 'os1', name: 'Purifier' } }),
      loadout({ playerId: 'p2', operatorSkill: { id: 'os2', name: 'Sparrow' } }),
    ])
    assert.equal(result.size, 0)
  })
})

describe('pool weapon class role', () => {
  const claim = (playerId: string, roles: string[]) => ({
    playerId,
    playerIgn: playerId,
    roles: roles as ('AR' | 'SMG' | 'LMG' | 'Shotgun' | 'Marksman' | 'Sniper')[],
  })

  it('menerima pool 3 AR / 3 SMG / 1 LMG / 1 Shotgun / 1 Marksman / 1 Sniper', () => {
    // Contoh dari ruleset: AR/SMG, SMG/Shotgun, AR/LMG, AR/Sniper, SMG/Marksman
    const issues = validateClassRolePool([
      claim('p1', ['AR', 'SMG']),
      claim('p2', ['SMG', 'Shotgun']),
      claim('p3', ['AR', 'LMG']),
      claim('p4', ['AR', 'Sniper']),
      claim('p5', ['SMG', 'Marksman']),
    ])
    assert.deepEqual(issues, [])
  })

  it('menandai role yang jumlahnya tidak pas', () => {
    const issues = validateClassRolePool([
      claim('p1', ['AR', 'AR']),
      claim('p2', ['SMG', 'Shotgun']),
      claim('p3', ['AR', 'LMG']),
      claim('p4', ['AR', 'Sniper']),
      claim('p5', ['SMG', 'Marksman']),
    ])
    assert.ok(issues.some((i) => i.type === 'count_mismatch' && i.role === 'AR' && i.declared === 4))
    assert.ok(issues.some((i) => i.type === 'count_mismatch' && i.role === 'SMG' && i.declared === 2))
  })

  it('menandai pemain yang deklarasi role-nya kurang', () => {
    const issues = validateClassRolePool([claim('p1', ['AR'])])
    assert.ok(issues.some((i) => i.type === 'wrong_role_count' && i.declared === 1))
  })
})
