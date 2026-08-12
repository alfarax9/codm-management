/**
 * Tipe payload JSONB dan tipe domain yang dipakai lintas layer.
 * Tidak boleh import apa pun dari `@/db` supaya bisa dipakai di client.
 */

/** Kode mode (`hp` | `snd` | `ctrl` | mode baru yang ditambah lewat UI). */
export type ModeCode = string

/**
 * Kuota map per mode untuk satu series format.
 * Kode `232` → `{ hp: 2, snd: 3, ctrl: 2 }` → 7 game.
 */
export type ModeQuota = Record<ModeCode, number>

/** Kolom statistik pemain yang ditampilkan untuk sebuah mode. */
export type StatColumn = {
  /** Key kolom di `game_player_stats` atau di `extra` jsonb-nya. */
  key: string
  /** Kunci terjemahan di messages/*.json, mis. `stats.objTime`. */
  labelKey: string
  format: 'number' | 'duration' | 'percent'
  /** Kolom yang selalu ada di semua mode (kills, deaths, dst) ditandai false. */
  modeSpecific: boolean
}

/**
 * Cakupan sebuah aturan. Kosong = berlaku global.
 * `{ weaponName: '3-Line Rifle' }` → attachment ban khusus senjata itu.
 * `{ weaponClass: 'Shotgun' }`     → "All Shotguns → Slug Ammo".
 * `{ perkSlot: 'red' }`            → ban perk di slot merah.
 * `{ modeCode: 'hp' }`             → gameplay setting khusus Hardpoint.
 */
export type RuleScope = {
  weaponName?: string
  weaponClass?: string
  perkSlot?: 'red' | 'green' | 'blue'
  modeCode?: ModeCode
}

/** Nilai untuk kategori `gameplay_setting`, mis. `{ scoreLimit: 250, timeLimit: 600 }`. */
export type RuleValue = Record<string, string | number | boolean>

export type ViolationSeverity = 'banned' | 'warning'

export type Violation = {
  severity: ViolationSeverity
  category: string
  itemLabel: string
  /** Kunci terjemahan + parameter, dirender di UI lewat next-intl. */
  reasonKey: string
  reasonParams?: Record<string, string | number>
  /** Lokasi item di dalam loadout, mis. `attachments[2]` — dipakai UI untuk menandai merah. */
  path: string
}

/** Metrik agregat pemain untuk satu periode; disimpan di `weekly_reports.metrics`. */
export type PlayerMetrics = {
  gamesPlayed: number
  kills: number
  deaths: number
  assists: number
  kd: number
  kdaPerGame: { kills: number; deaths: number; assists: number }
  avgScore: number
  avgImpact: number
  objTimePerGame: number
  mvpRate: number
  kdStdDev: number
  worstGameKd: number
  byMode: Record<ModeCode, { gamesPlayed: number; kd: number; avgImpact: number }>
}

export type MetricDelta = {
  current: number
  previous: number | null
  change: number | null
  changePct: number | null
}
