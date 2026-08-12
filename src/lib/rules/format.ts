import type { ModeCode, ModeQuota } from '@/types/domain'

/**
 * Aturan format scrim. Semua fungsi di sini murni — tidak menyentuh database —
 * supaya bisa dipakai di server (validasi sebelum simpan) maupun di client
 * (menonaktifkan opsi dropdown secara langsung).
 *
 * Notasi kode: satu digit per mode, urut mengikuti `modeOrder`.
 * `232` dengan modeOrder ['hp','snd','ctrl'] berarti 2 map HP, 3 map SnD, 2 map Control.
 * Urutan main bebas — kode hanya menentukan kuota.
 */

const MAX_PER_MODE = 9 // notasi satu digit

export type GameSlot = {
  id: string
  gameNo: number
  modeCode: ModeCode | null
  mapId: string | null
}

export class FormatCodeError extends Error {}

/** `'232'` + `['hp','snd','ctrl']` → `{ hp: 2, snd: 3, ctrl: 2 }` */
export function parseFormatCode(code: string, modeOrder: ModeCode[]): ModeQuota {
  if (!/^\d+$/.test(code)) {
    throw new FormatCodeError(`Kode format "${code}" harus berupa angka.`)
  }
  if (code.length !== modeOrder.length) {
    throw new FormatCodeError(
      `Kode format "${code}" punya ${code.length} digit, sedangkan ada ${modeOrder.length} mode.`,
    )
  }
  return Object.fromEntries(modeOrder.map((mode, i) => [mode, Number(code[i])]))
}

/** `{ hp: 2, snd: 3, ctrl: 2 }` → `'232'` */
export function buildFormatCode(quota: ModeQuota, modeOrder: ModeCode[]): string {
  return modeOrder
    .map((mode) => {
      const n = quota[mode] ?? 0
      if (!Number.isInteger(n) || n < 0 || n > MAX_PER_MODE) {
        throw new FormatCodeError(`Kuota mode "${mode}" harus bilangan bulat 0–${MAX_PER_MODE}.`)
      }
      return String(n)
    })
    .join('')
}

export function totalGames(quota: ModeQuota): number {
  return Object.values(quota).reduce((sum, n) => sum + n, 0)
}

/**
 * Sisa kuota tiap mode setelah memperhitungkan game yang sudah dipilih modenya.
 * `excludeGameId` dipakai saat mengedit satu slot: pilihannya sendiri tidak boleh
 * dihitung, kalau tidak mode yang sedang dipakai akan tampak habis.
 */
export function remainingQuota(
  quota: ModeQuota,
  games: readonly GameSlot[],
  excludeGameId?: string,
): ModeQuota {
  const remaining: ModeQuota = { ...quota }
  for (const game of games) {
    if (!game.modeCode || game.id === excludeGameId) continue
    remaining[game.modeCode] = (remaining[game.modeCode] ?? 0) - 1
  }
  return remaining
}

/** Mode yang masih boleh dipilih untuk sebuah slot — yang sisa kuotanya di atas nol. */
export function availableModes(
  quota: ModeQuota,
  games: readonly GameSlot[],
  forGameId: string,
): ModeCode[] {
  const remaining = remainingQuota(quota, games, forGameId)
  return Object.entries(remaining)
    .filter(([, n]) => n > 0)
    .map(([mode]) => mode)
}

/**
 * Map yang masih boleh dipilih untuk sebuah slot: dari pool mode tersebut,
 * dikurangi map yang sudah dipakai di mode yang sama pada scrim ini.
 */
export function availableMapIds(
  modePoolMapIds: readonly string[],
  games: readonly GameSlot[],
  modeCode: ModeCode,
  forGameId: string,
): string[] {
  const used = new Set(
    games
      .filter((g) => g.id !== forGameId && g.modeCode === modeCode && g.mapId)
      .map((g) => g.mapId as string),
  )
  return modePoolMapIds.filter((id) => !used.has(id))
}

export type CompositionIssue =
  | { type: 'quota_exceeded'; modeCode: ModeCode; used: number; allowed: number }
  | { type: 'quota_unfilled'; modeCode: ModeCode; used: number; allowed: number }
  | { type: 'duplicate_map'; modeCode: ModeCode; mapId: string; gameNos: number[] }
  | { type: 'empty_slot'; gameNo: number }

/**
 * Cek susunan scrim terhadap formatnya. Hasil kosong = boleh ditandai selesai.
 * `quota_unfilled` dan `empty_slot` wajar muncul saat scrim masih berjalan;
 * yang tidak boleh terjadi kapan pun adalah `quota_exceeded` dan `duplicate_map`.
 */
export function validateComposition(
  quota: ModeQuota,
  games: readonly GameSlot[],
): CompositionIssue[] {
  const issues: CompositionIssue[] = []
  const usedPerMode = new Map<ModeCode, number>()
  const mapsPerMode = new Map<ModeCode, Map<string, number[]>>()

  for (const game of games) {
    if (!game.modeCode) {
      issues.push({ type: 'empty_slot', gameNo: game.gameNo })
      continue
    }
    usedPerMode.set(game.modeCode, (usedPerMode.get(game.modeCode) ?? 0) + 1)

    if (game.mapId) {
      if (!mapsPerMode.has(game.modeCode)) mapsPerMode.set(game.modeCode, new Map())
      const byMap = mapsPerMode.get(game.modeCode) as Map<string, number[]>
      byMap.set(game.mapId, [...(byMap.get(game.mapId) ?? []), game.gameNo])
    }
  }

  for (const [modeCode, allowed] of Object.entries(quota)) {
    const used = usedPerMode.get(modeCode) ?? 0
    if (used > allowed) issues.push({ type: 'quota_exceeded', modeCode, used, allowed })
    else if (used < allowed) issues.push({ type: 'quota_unfilled', modeCode, used, allowed })
  }

  for (const [modeCode, byMap] of mapsPerMode) {
    for (const [mapId, gameNos] of byMap) {
      if (gameNos.length > 1) issues.push({ type: 'duplicate_map', modeCode, mapId, gameNos })
    }
  }

  return issues
}

/** Issue yang memblokir penyelesaian scrim vs yang cuma menandakan belum lengkap. */
export function isBlockingIssue(issue: CompositionIssue): boolean {
  return issue.type === 'quota_exceeded' || issue.type === 'duplicate_map'
}
