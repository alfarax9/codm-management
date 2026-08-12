import type { MetricDelta, ModeCode, PlayerMetrics } from '@/types/domain'

/** Satu baris statistik pemain di satu map, sudah digabung dengan mode-nya. */
export type StatRow = {
  modeCode: ModeCode
  score: number
  kills: number
  deaths: number
  assists: number
  objTimeSeconds: number
  impact: number
  isMvp: boolean
  /** Hasil map — dipakai untuk insight "K/D positif tapi kalah". */
  result: 'win' | 'loss' | 'tie' | null
}

const EMPTY: PlayerMetrics = {
  gamesPlayed: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
  kd: 0,
  kdaPerGame: { kills: 0, deaths: 0, assists: 0 },
  avgScore: 0,
  avgImpact: 0,
  objTimePerGame: 0,
  mvpRate: 0,
  kdStdDev: 0,
  worstGameKd: 0,
  byMode: {},
}

/** Deaths 0 diperlakukan sebagai 1 supaya K/D tidak jadi Infinity. */
function ratio(kills: number, deaths: number): number {
  return round2(kills / Math.max(deaths, 1))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function mean(values: readonly number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

function stdDev(values: readonly number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  return round2(Math.sqrt(mean(values.map((v) => (v - avg) ** 2))))
}

/**
 * Metrik agregat seorang pemain untuk satu periode. Sepenuhnya deterministik —
 * angka yang sama selalu menghasilkan rapor yang sama, jadi bisa diaudit
 * dan dibandingkan antar minggu.
 */
export function computePlayerMetrics(rows: readonly StatRow[]): PlayerMetrics {
  if (rows.length === 0) return EMPTY

  const n = rows.length
  const kills = sum(rows, (r) => r.kills)
  const deaths = sum(rows, (r) => r.deaths)
  const assists = sum(rows, (r) => r.assists)
  const perGameKd = rows.map((r) => ratio(r.kills, r.deaths))

  const byMode: PlayerMetrics['byMode'] = {}
  for (const row of rows) {
    const bucket = (byMode[row.modeCode] ??= { gamesPlayed: 0, kd: 0, avgImpact: 0 })
    bucket.gamesPlayed += 1
  }
  for (const [modeCode, bucket] of Object.entries(byMode)) {
    const modeRows = rows.filter((r) => r.modeCode === modeCode)
    bucket.kd = ratio(sum(modeRows, (r) => r.kills), sum(modeRows, (r) => r.deaths))
    bucket.avgImpact = round2(mean(modeRows.map((r) => r.impact)))
  }

  return {
    gamesPlayed: n,
    kills,
    deaths,
    assists,
    kd: ratio(kills, deaths),
    kdaPerGame: {
      kills: round2(kills / n),
      deaths: round2(deaths / n),
      assists: round2(assists / n),
    },
    avgScore: Math.round(mean(rows.map((r) => r.score))),
    avgImpact: Math.round(mean(rows.map((r) => r.impact))),
    objTimePerGame: Math.round(mean(rows.map((r) => r.objTimeSeconds))),
    mvpRate: round2(rows.filter((r) => r.isMvp).length / n),
    kdStdDev: stdDev(perGameKd),
    worstGameKd: Math.min(...perGameKd),
    byMode,
  }
}

function sum<T>(rows: readonly T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0)
}

/** Metrik skalar yang ditampilkan sebagai panah naik/turun di rapor mingguan. */
const TRACKED_KEYS = [
  'kd',
  'avgScore',
  'avgImpact',
  'objTimePerGame',
  'mvpRate',
  'kdStdDev',
] as const

export function computeDeltas(
  current: PlayerMetrics,
  previous: PlayerMetrics | null,
): Record<string, MetricDelta> {
  const deltas: Record<string, MetricDelta> = {}
  for (const key of TRACKED_KEYS) {
    const now = current[key] as number
    const before = previous ? (previous[key] as number) : null
    deltas[key] = {
      current: now,
      previous: before,
      change: before === null ? null : round2(now - before),
      changePct: before === null || before === 0 ? null : round2(((now - before) / before) * 100),
    }
  }
  return deltas
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

/**
 * Grade dari komposit tiga sumbu yang dinormalisasi terhadap rata-rata tim:
 * slaying (K/D), impact, dan objektif. Relatif terhadap tim, bukan angka absolut —
 * baseline K/D berbeda jauh antar tier lawan.
 */
export function gradeFromMetrics(player: PlayerMetrics, teamAverage: PlayerMetrics): Grade {
  if (player.gamesPlayed === 0) return 'D'

  const rel = (value: number, base: number) => (base > 0 ? value / base : 1)
  const composite =
    rel(player.kd, teamAverage.kd) * 0.4 +
    rel(player.avgImpact, teamAverage.avgImpact) * 0.35 +
    rel(player.objTimePerGame, teamAverage.objTimePerGame) * 0.25

  if (composite >= 1.25) return 'S'
  if (composite >= 1.08) return 'A'
  if (composite >= 0.92) return 'B'
  if (composite >= 0.78) return 'C'
  return 'D'
}

/**
 * Map di mana pemain outslay lawan tapi timnya tetap kalah — sinyal paling kuat
 * bahwa masalahnya di objektif, bukan di duel.
 */
export function positiveKdLosses(rows: readonly StatRow[]): StatRow[] {
  return rows.filter((r) => r.result === 'loss' && ratio(r.kills, r.deaths) > 1)
}

export function negativeKdWins(rows: readonly StatRow[]): StatRow[] {
  return rows.filter((r) => r.result === 'win' && ratio(r.kills, r.deaths) < 1)
}
