import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { maps, modes, seriesFormats } from './catalog'
import {
  extractionStatus,
  gameResult,
  roundSide,
  scrimStatus,
  side,
  sndEndedBy,
} from './enums'
import { organizations, players, profiles, teams } from './org'
import { rulesets } from './rules'

/** Tim lawan. Disimpan di level org supaya riwayat head-to-head lintas roster. */
export const opponents = pgTable(
  'opponents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tag: text('tag'),
    logoUrl: text('logo_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('opponents_org_name_idx').on(t.orgId, t.name)],
)

/** Pemain lawan — opsional, hanya kalau mau scouting. */
export const opponentPlayers = pgTable(
  'opponent_players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    opponentId: uuid('opponent_id')
      .notNull()
      .references(() => opponents.id, { onDelete: 'cascade' }),
    ign: text('ign').notNull(),
  },
  (t) => [uniqueIndex('opponent_players_ign_idx').on(t.opponentId, t.ign)],
)

/**
 * Satu sesi scrim = satu series melawan satu lawan, dengan satu format dan satu ruleset.
 * Jumlah game ditentukan `seriesFormats.gamesCount`; mode tiap game dipilih saat mengisi,
 * dibatasi sisa kuota (lihat `@/lib/rules/format`).
 */
export const scrims = pgTable(
  'scrims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    opponentId: uuid('opponent_id').references(() => opponents.id, { onDelete: 'set null' }),
    seriesFormatId: uuid('series_format_id')
      .notNull()
      .references(() => seriesFormats.id, { onDelete: 'restrict' }),
    rulesetId: uuid('ruleset_id').references(() => rulesets.id, { onDelete: 'set null' }),
    weekId: uuid('week_id'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: scrimStatus('status').notNull().default('scheduled'),
    ourWins: integer('our_wins').notNull().default(0),
    theirWins: integer('their_wins').notNull().default(0),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('scrims_team_date_idx').on(t.teamId, t.scheduledAt),
    index('scrims_week_idx').on(t.weekId),
    index('scrims_opponent_idx').on(t.opponentId),
  ],
)

/**
 * Satu map dalam scrim. `modeId` dan `mapId` nullable karena slot dibuat kosong
 * lebih dulu (sesuai gamesCount) lalu diisi saat report.
 */
export const scrimGames = pgTable(
  'scrim_games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scrimId: uuid('scrim_id')
      .notNull()
      .references(() => scrims.id, { onDelete: 'cascade' }),
    gameNo: integer('game_no').notNull(),
    modeId: uuid('mode_id').references(() => modes.id, { onDelete: 'set null' }),
    mapId: uuid('map_id').references(() => maps.id, { onDelete: 'set null' }),
    result: gameResult('result'),
    ourScore: integer('our_score'),
    theirScore: integer('their_score'),
    playedAt: timestamp('played_at', { withTimezone: true }),

    // Agregat tim dari header scoreboard CODM.
    teamKdRatio: numeric('team_kd_ratio', { precision: 5, scale: 2 }),
    teamAccuracy: numeric('team_accuracy', { precision: 5, scale: 2 }),
    teamHeadshotPct: numeric('team_headshot_pct', { precision: 5, scale: 2 }),

    screenshotUrl: text('screenshot_url'),
    extractionStatus: extractionStatus('extraction_status').notNull().default('none'),
  },
  (t) => [
    uniqueIndex('scrim_games_scrim_no_idx').on(t.scrimId, t.gameNo),
    index('scrim_games_map_mode_idx').on(t.mapId, t.modeId),
  ],
)

/**
 * Statistik per pemain per map, mengikuti kolom scoreboard CODM:
 * SKOR · K/D/A · WAKTU · IMPACT. Tidak ada DAMAGE (CODM tidak menampilkannya).
 *
 * `playerId` terisi untuk side `us`, `opponentPlayerId` untuk side `them`.
 * `ign` selalu diisi sebagai snapshot — nama in-game bisa berubah, riwayat tidak boleh ikut berubah.
 */
export const gamePlayerStats = pgTable(
  'game_player_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scrimGameId: uuid('scrim_game_id')
      .notNull()
      .references(() => scrimGames.id, { onDelete: 'cascade' }),
    side: side('side').notNull().default('us'),
    playerId: uuid('player_id').references(() => players.id, { onDelete: 'set null' }),
    opponentPlayerId: uuid('opponent_player_id').references(() => opponentPlayers.id, {
      onDelete: 'set null',
    }),
    ign: text('ign').notNull(),
    placement: integer('placement'),
    score: integer('score').notNull().default(0),
    kills: integer('kills').notNull().default(0),
    deaths: integer('deaths').notNull().default(0),
    assists: integer('assists').notNull().default(0),
    /** WAKTU di scoreboard (hill time / zone time), disimpan dalam detik. */
    objTimeSeconds: integer('obj_time_seconds').notNull().default(0),
    impact: integer('impact').notNull().default(0),
    isMvp: boolean('is_mvp').notNull().default(false),
  },
  (t) => [
    index('game_player_stats_game_idx').on(t.scrimGameId),
    index('game_player_stats_player_idx').on(t.playerId),
  ],
)

// ---------------------------------------------------------------------------
// Detail alur per mode. Satu tabel per mode karena bentuk datanya benar-benar beda.
// ---------------------------------------------------------------------------

export const sndRounds = pgTable(
  'snd_rounds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scrimGameId: uuid('scrim_game_id')
      .notNull()
      .references(() => scrimGames.id, { onDelete: 'cascade' }),
    roundNo: integer('round_no').notNull(),
    result: gameResult('result').notNull(),
    endedBy: sndEndedBy('ended_by'),
    side: roundSide('side'),
    ourScore: integer('our_score').notNull().default(0),
    theirScore: integer('their_score').notNull().default(0),
  },
  (t) => [uniqueIndex('snd_rounds_game_no_idx').on(t.scrimGameId, t.roundNo)],
)

export const hpHills = pgTable(
  'hp_hills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scrimGameId: uuid('scrim_game_id')
      .notNull()
      .references(() => scrimGames.id, { onDelete: 'cascade' }),
    hillNo: integer('hill_no').notNull(),
    hillName: text('hill_name'),
    ourTimeSeconds: integer('our_time_seconds').notNull().default(0),
    theirTimeSeconds: integer('their_time_seconds').notNull().default(0),
    ourScoreAfter: integer('our_score_after'),
    theirScoreAfter: integer('their_score_after'),
  },
  (t) => [uniqueIndex('hp_hills_game_no_idx').on(t.scrimGameId, t.hillNo)],
)

export const ctrlRounds = pgTable(
  'ctrl_rounds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scrimGameId: uuid('scrim_game_id')
      .notNull()
      .references(() => scrimGames.id, { onDelete: 'cascade' }),
    roundNo: integer('round_no').notNull(),
    side: roundSide('side'),
    result: gameResult('result').notNull(),
    ourTickets: integer('our_tickets'),
    theirTickets: integer('their_tickets'),
    objectivesCaptured: integer('objectives_captured'),
  },
  (t) => [uniqueIndex('ctrl_rounds_game_no_idx').on(t.scrimGameId, t.roundNo)],
)
