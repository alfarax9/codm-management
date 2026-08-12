import type { ModeQuota, StatColumn } from '@/types/domain'

/**
 * Data referensi yang tidak bergantung organisasi. Dipakai `src/db/seed/run.ts`
 * dan juga sebagai sumber kebenaran untuk unit test.
 */

const BASE_STATS: StatColumn[] = [
  { key: 'score', labelKey: 'stats.score', format: 'number', modeSpecific: false },
  { key: 'kills', labelKey: 'stats.kills', format: 'number', modeSpecific: false },
  { key: 'deaths', labelKey: 'stats.deaths', format: 'number', modeSpecific: false },
  { key: 'assists', labelKey: 'stats.assists', format: 'number', modeSpecific: false },
  { key: 'impact', labelKey: 'stats.impact', format: 'number', modeSpecific: false },
]

const objTime = (labelKey: string): StatColumn => ({
  key: 'objTimeSeconds',
  labelKey,
  format: 'duration',
  modeSpecific: true,
})

/**
 * Urutan ini menentukan posisi digit pada kode format: hp = digit ke-1,
 * snd = ke-2, ctrl = ke-3. Mengubah `sortOrder` akan mengubah arti semua kode
 * format yang sudah tersimpan — jangan diubah tanpa migrasi.
 */
export const MODES = [
  {
    code: 'hp',
    name: 'Hardpoint',
    shortName: 'HP',
    sortOrder: 1,
    objTimeLabelKey: 'stats.hillTime',
    statColumns: [...BASE_STATS, objTime('stats.hillTime')],
  },
  {
    code: 'snd',
    name: 'Search & Destroy',
    shortName: 'SND',
    sortOrder: 2,
    objTimeLabelKey: null,
    statColumns: BASE_STATS,
  },
  {
    code: 'ctrl',
    name: 'Control',
    shortName: 'CTRL',
    sortOrder: 3,
    objTimeLabelKey: 'stats.zoneTime',
    statColumns: [...BASE_STATS, objTime('stats.zoneTime')],
  },
] as const

export const MODE_ORDER = MODES.map((m) => m.code)

/** Format yang biasa dipakai saat scrim. Kode = kuota map per mode (HP·SND·CTRL). */
export const SERIES_FORMAT_CODES = [
  '111',
  '211',
  '122',
  '212',
  '123',
  '132',
  '222',
  '231',
  '321',
  '322',
  '331',
  '333',
] as const

/** Map pool World Championship 2026, per mode. */
export const WC2026_MAP_POOL: Record<string, string[]> = {
  hp: ['Summit', 'Hacienda', 'Combine', 'Takeoff', 'Arsenal'],
  snd: ['Tunisia', 'Firing Range', 'Coastal', 'Slums', 'Meltdown'],
  ctrl: ['Raid', 'Standoff', 'Crossroads Strike'],
}

// ---------------------------------------------------------------------------
// Ruleset World Championship 2026 — restriksi loadout.
// Sumber: gambar "Updated World Championship Ruleset 2026 COD:M".
// ---------------------------------------------------------------------------

export const WC2026_BANNED_WEAPONS = [
  { name: 'NA-45', class: 'Sniper' },
  { name: 'SVD', class: 'Sniper' },
  { name: 'XPR', class: 'Sniper' },
  { name: 'SO14', class: 'Sniper' },
  { name: 'Argus', class: 'Shotgun' },
  { name: 'Shorty', class: 'Pistol' },
  { name: 'D13 Sector', class: 'Launcher' },
  { name: 'FHJ-18', class: 'Launcher' },
  { name: 'SMRS', class: 'Launcher' },
  { name: 'Thumper', class: 'Launcher' },
] as const

/**
 * Attachment yang dilarang. `weapon` null = berlaku di semua senjata;
 * `weaponClass` = berlaku untuk seluruh kelas itu.
 */
export const WC2026_BANNED_ATTACHMENTS = [
  { name: 'Akimbo', weapon: null, weaponClass: null },
  { name: 'Disable', weapon: null, weaponClass: null },
  { name: 'Thermite Ammo', weapon: null, weaponClass: null },
  { name: "Dragon's Breath Ammo", weapon: null, weaponClass: null },
  { name: 'Explosive Ammo', weapon: null, weaponClass: null },
  { name: 'Incendiary Ammo', weapon: null, weaponClass: null },
  { name: 'Slug Ammo', weapon: null, weaponClass: 'Shotgun' },

  { name: 'EMPRESS 514MM F01 Barrel', weapon: '3-Line Rifle', weaponClass: null },
  { name: 'Bipod', weapon: '3-Line Rifle', weaponClass: null },
  { name: 'KOVALEVSKAYA S01 Stock', weapon: '3-Line Rifle', weaponClass: null },
  { name: 'Lightweight Trigger', weapon: '50 GS', weaponClass: null },
  { name: 'Match Grade Trigger', weapon: '50 GS', weaponClass: null },
  { name: '15 Round FMG Mag', weapon: 'AS VAL', weaponClass: null },
  { name: 'Leroy 438mm', weapon: 'BP-50', weaponClass: null },
  { name: 'Recoil Booster', weapon: 'BP-50', weaponClass: null },
  { name: 'M67 Ammo', weapon: 'CR AMAX', weaponClass: null },
  { name: 'Thermite Bolts', weapon: 'Crossbow', weaponClass: null },
  { name: 'Gas Bolts', weapon: 'Crossbow', weaponClass: null },
  { name: 'Sticky Grenade Bolts', weapon: 'Crossbow', weaponClass: null },
  { name: '9mm Hollow Point Rounds', weapon: 'CX9', weaponClass: null },
  { name: 'Concussion Ammo', weapon: 'DLQ', weaponClass: null },
  { name: 'OTM Mag', weapon: 'DRH', weaponClass: null },
  { name: 'Heartseeker', weapon: 'Hades', weaponClass: null },
  { name: 'Thunder Rounds', weapon: 'HS0405', weaponClass: null },
  { name: 'Large Caliber Mag', weapon: 'HVK', weaponClass: null },
  { name: '13.0" OSW Para Barrel', weapon: 'LAG 53', weaponClass: null },
  { name: 'Underbarrel Launcher', weapon: 'M4', weaponClass: null },
  { name: 'VDD 35MM Short Barrel', weapon: 'Machine Pistol', weaponClass: null },
  { name: 'KRAUSNICK 355MM Rapid', weapon: 'MG42', weaponClass: null },
  { name: '6.5 ARISAKA 125 Round Drums', weapon: 'MG42', weaponClass: null },
  { name: 'Recoil Booster', weapon: 'MG42', weaponClass: null },
  { name: 'OWC Ranger Barrel', weapon: 'Oden', weaponClass: null },
  { name: 'OWC Marksman Barrel', weapon: 'Oden', weaponClass: null },
  { name: '10MM 30 Round Reload', weapon: 'QQ9', weaponClass: null },
  { name: 'FORGE TAC Eclipse Barrell', weapon: 'Ram7', weaponClass: null },
  { name: 'Infinite Ammo', weapon: 'RPD', weaponClass: null },
  { name: 'Tactical Foregrip A', weapon: 'SKS', weaponClass: null },
  { name: 'Granulated Grip Tape', weapon: 'SKS', weaponClass: null },
  { name: 'Hi-Accuracy Sniper Ammo', weapon: 'Type 19', weaponClass: null },
  { name: 'Airborne Elastic Wrap Grip', weapon: 'Type 63', weaponClass: null },
  { name: 'Firm Grip Tape', weapon: 'Type 63', weaponClass: null },
  { name: '16.4" Rapid Fire Barrel', weapon: 'Type 63', weaponClass: null },
  { name: '16.4" Titanium Barrel', weapon: 'Type 63', weaponClass: null },
  { name: '18.3" Strike Team Barrel', weapon: 'Type 63', weaponClass: null },
  { name: '26.5" Hammer Forged Barrel', weapon: 'Tundra', weaponClass: null },
  { name: '28.2" Tiger Team Barrel', weapon: 'Tundra', weaponClass: null },
  { name: 'Carbine Pro Barrel', weapon: 'USS-9', weaponClass: null },
  { name: '16.6" Factory Carbine Barrel', weapon: 'USS-9', weaponClass: null },
  { name: '13.1" First Responder Barrel', weapon: 'USS-9', weaponClass: null },
  { name: '.41 AE 32-Round Mags', weapon: 'USS-9', weaponClass: null },
] as const

export const WC2026_BANNED_LETHALS = [
  'C4',
  'Cluster Grenade',
  'Contact Grenade',
  'Drill Charge',
  'Molotov Cocktail',
  'Thermite',
  'Trip Mine',
] as const

export const WC2026_BANNED_TACTICALS = [
  'Cryo Bomb',
  'Decoy Grenade',
  'Douser Grenade',
  'Echo Grenade',
  'Flash Charge',
  'Flash Drone',
  'Gas Grenades',
  'Heartbeat Sensor',
  'Inflatable Decoy',
  'Stim Shot',
  'Storm Ball',
  'Trip Sensor',
] as const

export const WC2026_BANNED_PERKS: { slot: 'red' | 'green' | 'blue'; name: string }[] = [
  { slot: 'red', name: 'Martyrdom' },
  { slot: 'red', name: 'Overclock' },
  { slot: 'red', name: 'Pinpoint' },
  { slot: 'red', name: 'Restock' },
  { slot: 'red', name: 'Tactician' },
  { slot: 'green', name: 'Quick Fix' },
  { slot: 'green', name: 'Recon' },
  { slot: 'green', name: 'Tracker' },
  { slot: 'green', name: 'Vulture' },
  { slot: 'blue', name: 'Alert' },
  { slot: 'blue', name: 'Assassin' },
  { slot: 'blue', name: 'Engineer' },
  { slot: 'blue', name: 'Hardline' },
  { slot: 'blue', name: 'High Alert' },
  { slot: 'blue', name: 'Persistence' },
  { slot: 'blue', name: 'Unit Support' },
  { slot: 'blue', name: 'Demo Expert' },
  { slot: 'blue', name: 'Shrapnel' },
]

/** Allowlist — semua operator skill di luar daftar ini dilarang. */
export const WC2026_ALLOWED_OPERATOR_SKILLS = [
  'Annihilator',
  'Claw',
  'Death Machine',
  'Equalizer',
  'Gravity Spikes',
  'Gravity Vortex Gun',
  'Purifier',
  'Sparrow',
  'Tempest',
  'War Machine',
] as const

/** Allowlist — semua scorestreak di luar daftar ini dilarang. */
export const WC2026_ALLOWED_SCORESTREAKS = [
  'Hunter Killer Drone',
  'Predator Missile',
  'EMP',
] as const

export const WC2026_BANNED_COSMETICS = [
  'Cosmic Silverback',
  'Death Angel Alice - Trench',
  'Death Angel Alice - Shrouded Maiden',
  'Florence - Night Terror',
  'Golem - Everglade',
  'Grinch - Night Fang',
  'Grinch - Wreath Havoc',
  'Grinch - The Lionheart',
  'Roze - Murk',
  'Roze - Rook',
  'Zombie - Wicht Warden',
] as const

/** Pengaturan lobby per mode. */
export const WC2026_GAMEPLAY_SETTINGS: Record<string, Record<string, number | boolean>> = {
  hp: { scoreLimit: 250, timeLimit: 600, allowInvite: true },
  ctrl: { roundScoreLimit: 3, roundTimeLimit: 90, allowInvite: true },
  snd: { roundWinLimit: 9, roundTimeLimit: 120, overtime: true, overtimeCap: 20, allowInvite: true },
}

/** Pool weapon class role satu tim: 5 pemain × 2 role = 10 deklarasi. */
export const WC2026_CLASS_ROLE_POOL = {
  AR: 3,
  SMG: 3,
  LMG: 1,
  Shotgun: 1,
  Marksman: 1,
  Sniper: 1,
} as const

/** Kuota format dihitung dari kode, tidak ditulis dua kali. */
export function quotaFromCode(code: string): ModeQuota {
  return Object.fromEntries(MODE_ORDER.map((mode, i) => [mode, Number(code[i])]))
}
