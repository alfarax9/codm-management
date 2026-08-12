import { pgEnum } from 'drizzle-orm/pg-core'

/** Peran di level organisasi. */
export const orgRole = pgEnum('org_role', [
  'owner',
  'admin',
  'coach',
  'analyst',
  'player',
  'viewer',
])

/** Peran di level roster. */
export const teamRole = pgEnum('team_role', ['captain', 'player', 'analyst', 'viewer'])

/** Kelas senjata CODM — dipakai katalog senjata dan weapon class role. */
export const weaponClass = pgEnum('weapon_class', [
  'AR',
  'SMG',
  'LMG',
  'Shotgun',
  'Marksman',
  'Sniper',
  'Pistol',
  'Launcher',
  'Melee',
])

/** Enam role yang dideklarasikan pemain (subset weaponClass, tanpa Pistol/Launcher/Melee). */
export const classRole = pgEnum('class_role', [
  'AR',
  'SMG',
  'LMG',
  'Shotgun',
  'Marksman',
  'Sniper',
])

export const perkSlot = pgEnum('perk_slot', ['red', 'green', 'blue'])
export const utilityType = pgEnum('utility_type', ['lethal', 'tactical'])

/**
 * Ruleset punya dua model restriksi:
 * `ban`   — item yang terdaftar dilarang, sisanya boleh (weapon, attachment, perk, utility)
 * `allow` — hanya item terdaftar yang boleh (operator skill, scorestreak)
 */
export const restrictionMode = pgEnum('restriction_mode', ['ban', 'allow'])

export const ruleCategory = pgEnum('rule_category', [
  'weapon',
  'attachment',
  'perk',
  'lethal',
  'tactical',
  'operator_skill',
  'scorestreak',
  'wildcard',
  'cosmetic',
  'gameplay_setting',
  'map_pool',
  'class_role',
  'custom',
])

export const rulesetStatus = pgEnum('ruleset_status', ['draft', 'active', 'archived'])
export const rulesetSourceType = pgEnum('ruleset_source_type', ['image', 'pdf', 'manual'])

export const scrimStatus = pgEnum('scrim_status', [
  'scheduled',
  'live',
  'completed',
  'cancelled',
])

export const gameResult = pgEnum('game_result', ['win', 'loss', 'tie'])
export const side = pgEnum('side', ['us', 'them'])

export const sndEndedBy = pgEnum('snd_ended_by', [
  'elimination',
  'bomb_exploded',
  'bomb_defused',
  'time_expired',
])

export const roundSide = pgEnum('round_side', ['atk', 'def'])

/** Status ekstraksi AI dari screenshot scoreboard. */
export const extractionStatus = pgEnum('extraction_status', [
  'none',
  'pending',
  'review',
  'confirmed',
  'failed',
])

export const assignmentScope = pgEnum('assignment_scope', ['scrim', 'week'])
export const assignmentStatus = pgEnum('assignment_status', ['pending', 'in_progress', 'done'])
export const reviewSource = pgEnum('review_source', ['human', 'ai'])

export const locale = pgEnum('locale', ['id', 'en'])
