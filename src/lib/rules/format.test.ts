import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  availableMapIds,
  availableModes,
  buildFormatCode,
  FormatCodeError,
  type GameSlot,
  parseFormatCode,
  remainingQuota,
  totalGames,
  validateComposition,
} from './format'

const MODE_ORDER = ['hp', 'snd', 'ctrl']

const slot = (gameNo: number, modeCode: string | null = null, mapId: string | null = null): GameSlot => ({
  id: `g${gameNo}`,
  gameNo,
  modeCode,
  mapId,
})

describe('kode format', () => {
  it('232 berarti 2 HP, 3 SnD, 2 Control', () => {
    assert.deepEqual(parseFormatCode('232', MODE_ORDER), { hp: 2, snd: 3, ctrl: 2 })
    assert.equal(totalGames(parseFormatCode('232', MODE_ORDER)), 7)
  })

  it('111 adalah tiga game, satu tiap mode', () => {
    assert.deepEqual(parseFormatCode('111', MODE_ORDER), { hp: 1, snd: 1, ctrl: 1 })
    assert.equal(totalGames(parseFormatCode('111', MODE_ORDER)), 3)
  })

  it('bolak-balik antara kode dan kuota', () => {
    for (const code of ['111', '122', '232', '321', '333']) {
      assert.equal(buildFormatCode(parseFormatCode(code, MODE_ORDER), MODE_ORDER), code)
    }
  })

  it('menolak kode yang panjangnya tidak sesuai jumlah mode', () => {
    assert.throws(() => parseFormatCode('23', MODE_ORDER), FormatCodeError)
    assert.throws(() => parseFormatCode('2a2', MODE_ORDER), FormatCodeError)
  })
})

describe('sisa kuota', () => {
  const quota = { hp: 2, snd: 3, ctrl: 2 }

  it('berkurang tiap kali sebuah mode dipilih', () => {
    const games = [slot(1, 'snd'), slot(2, 'hp'), slot(3, 'snd')]
    assert.deepEqual(remainingQuota(quota, games), { hp: 1, snd: 1, ctrl: 2 })
  })

  it('tidak menghitung slot yang sedang diedit', () => {
    const games = [slot(1, 'hp'), slot(2, 'hp')]
    // Tanpa pengecualian, hp akan tampak habis dan mode yang sedang dipakai hilang dari dropdown.
    assert.deepEqual(remainingQuota(quota, games, 'g2'), { hp: 1, snd: 3, ctrl: 2 })
    assert.ok(availableModes(quota, games, 'g2').includes('hp'))
  })

  it('mode yang kuotanya habis tidak lagi bisa dipilih', () => {
    const games = [slot(1, 'hp'), slot(2, 'hp'), slot(3, null)]
    assert.deepEqual(availableModes(quota, games, 'g3').sort(), ['ctrl', 'snd'])
  })
})

describe('map yang tersedia', () => {
  const pool = ['summit', 'hacienda', 'combine']

  it('menyingkirkan map yang sudah dipakai di mode yang sama', () => {
    const games = [slot(1, 'hp', 'summit'), slot(2, 'hp', null)]
    assert.deepEqual(availableMapIds(pool, games, 'hp', 'g2'), ['hacienda', 'combine'])
  })

  it('map yang dipakai di mode lain tidak ikut disingkirkan', () => {
    const games = [slot(1, 'ctrl', 'summit'), slot(2, 'hp', null)]
    assert.deepEqual(availableMapIds(pool, games, 'hp', 'g2'), pool)
  })
})

describe('validasi susunan scrim', () => {
  const quota = { hp: 2, snd: 1, ctrl: 0 }

  it('scrim lengkap tanpa duplikat tidak menghasilkan issue', () => {
    const games = [slot(1, 'hp', 'summit'), slot(2, 'hp', 'combine'), slot(3, 'snd', 'slums')]
    assert.deepEqual(validateComposition(quota, games), [])
  })

  it('menandai map yang sama dipakai dua kali di satu mode', () => {
    const games = [slot(1, 'hp', 'summit'), slot(2, 'hp', 'summit'), slot(3, 'snd', 'slums')]
    assert.deepEqual(validateComposition(quota, games), [
      { type: 'duplicate_map', modeCode: 'hp', mapId: 'summit', gameNos: [1, 2] },
    ])
  })

  it('menandai kuota yang terlampaui dan yang belum penuh', () => {
    const games = [slot(1, 'snd', 'slums'), slot(2, 'snd', 'coastal')]
    const issues = validateComposition(quota, games)
    assert.ok(issues.some((i) => i.type === 'quota_unfilled' && i.modeCode === 'hp'))
    assert.ok(issues.some((i) => i.type === 'quota_exceeded' && i.modeCode === 'snd'))
  })

  it('menandai slot yang belum diisi', () => {
    const issues = validateComposition(quota, [slot(1, null)])
    assert.ok(issues.some((i) => i.type === 'empty_slot' && i.gameNo === 1))
  })
})
