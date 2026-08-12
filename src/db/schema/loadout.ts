import { sql } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { operatorSkills, weapons } from './catalog'
import { classRole } from './enums'
import { players, profiles } from './org'
import { scrims } from './scrim'

/**
 * Loadout pemain. `scrimId` null = loadout default;
 * terisi = loadout khusus untuk scrim tersebut.
 *
 * Attachment / perk / scorestreak disimpan sebagai array id, bukan tabel pivot:
 * selalu dibaca dan ditulis utuh sebagai satu loadout, tidak pernah di-query per item.
 */
export const loadouts = pgTable(
  'loadouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    scrimId: uuid('scrim_id').references(() => scrims.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    weaponId: uuid('weapon_id').references(() => weapons.id, { onDelete: 'set null' }),
    attachmentIds: uuid('attachment_ids').array().notNull().default(sql`ARRAY[]::uuid[]`),
    perkIds: uuid('perk_ids').array().notNull().default(sql`ARRAY[]::uuid[]`),
    lethalId: uuid('lethal_id'),
    tacticalId: uuid('tactical_id'),
    operatorSkillId: uuid('operator_skill_id').references(() => operatorSkills.id, {
      onDelete: 'set null',
    }),
    scorestreakIds: uuid('scorestreak_ids').array().notNull().default(sql`ARRAY[]::uuid[]`),
    updatedBy: uuid('updated_by').references(() => profiles.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('loadouts_player_scrim_idx').on(t.playerId, t.scrimId)],
)

/**
 * Deklarasi weapon class role per pemain per scrim.
 * Ruleset WC 2026: tiap pemain declare 2 role, dan pool satu tim harus persis
 * 3 AR / 3 SMG / 1 LMG / 1 Shotgun / 1 Marksman / 1 Sniper.
 */
export const classRoleClaims = pgTable(
  'class_role_claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scrimId: uuid('scrim_id')
      .notNull()
      .references(() => scrims.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    roles: classRole('roles').array().notNull(),
  },
  (t) => [uniqueIndex('class_role_claims_scrim_player_idx').on(t.scrimId, t.playerId)],
)
