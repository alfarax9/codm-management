import { sql } from 'drizzle-orm'
import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import type { MetricDelta, PlayerMetrics } from '@/types/domain'

import { assignmentScope, assignmentStatus, reviewSource } from './enums'
import { organizations, players, profiles, teams } from './org'
import { scrimGames, scrims } from './scrim'

/** Periode mingguan sebagai unit review. Dimiliki org supaya semua roster sejajar. */
export const weeks = pgTable(
  'weeks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
  },
  (t) => [uniqueIndex('weeks_org_start_idx').on(t.orgId, t.startDate)],
)

/**
 * Penugasan analyst. `scope` menentukan kolom mana yang terisi:
 *   scrim → scrimId
 *   week  → weekId
 * `playerId` null = analyst bertanggung jawab atas seluruh roster.
 */
export const analystAssignments = pgTable(
  'analyst_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    analystId: uuid('analyst_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    scope: assignmentScope('scope').notNull(),
    scrimId: uuid('scrim_id').references(() => scrims.id, { onDelete: 'cascade' }),
    weekId: uuid('week_id').references(() => weeks.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id').references(() => players.id, { onDelete: 'cascade' }),
    status: assignmentStatus('status').notNull().default('pending'),
    assignedBy: uuid('assigned_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('analyst_assignments_analyst_idx').on(t.analystId, t.status),
    index('analyst_assignments_scrim_idx').on(t.scrimId),
    index('analyst_assignments_week_idx').on(t.weekId),
  ],
)

/**
 * Penilaian kualitatif seorang analyst terhadap seorang pemain.
 * `scrimGameId` terisi kalau review-nya spesifik satu map.
 */
export const playerReviews = pgTable(
  'player_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => analystAssignments.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    scrimGameId: uuid('scrim_game_id').references(() => scrimGames.id, { onDelete: 'cascade' }),
    /** Skala 1–5 per sumbu: slaying, objective, consistency, utility, comms. */
    ratings: jsonb('ratings').$type<Record<string, number>>().notNull().default({}),
    strengths: text('strengths').array().notNull().default(sql`ARRAY[]::text[]`),
    weaknesses: text('weaknesses').array().notNull().default(sql`ARRAY[]::text[]`),
    notes: text('notes'),
    source: reviewSource('source').notNull().default('human'),
    authorId: uuid('author_id').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('player_reviews_player_idx').on(t.playerId)],
)

/**
 * Rapor mingguan per pemain. `metrics` dihitung deterministik dari `gamePlayerStats`
 * (lihat `@/lib/metrics`), `summary` ditulis analyst — boleh dibantu draft AI.
 */
export const weeklyReports = pgTable(
  'weekly_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    weekId: uuid('week_id')
      .notNull()
      .references(() => weeks.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    metrics: jsonb('metrics').$type<PlayerMetrics>().notNull(),
    deltas: jsonb('deltas').$type<Record<string, MetricDelta>>(),
    grade: text('grade'),
    summary: text('summary'),
    summarySource: reviewSource('summary_source'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('weekly_reports_week_player_idx').on(t.weekId, t.playerId)],
)
