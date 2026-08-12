import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import type { RuleScope, RuleValue } from '@/types/domain'

import { maps, modes } from './catalog'
import { restrictionMode, ruleCategory, rulesetSourceType, rulesetStatus } from './enums'
import { organizations, profiles } from './org'

/**
 * Satu ruleset = satu dokumen aturan turnamen yang di-upload lalu di-parse.
 * `parsedRaw` menyimpan keluaran mentah AI untuk audit; kebenaran ada di `rulesetRules`
 * setelah direview manusia.
 */
export const rulesets = pgTable(
  'rulesets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    version: integer('version').notNull().default(1),
    sourceFileUrl: text('source_file_url'),
    sourceType: rulesetSourceType('source_type').notNull().default('manual'),
    parsedRaw: jsonb('parsed_raw'),
    status: rulesetStatus('status').notNull().default('draft'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rulesets_org_status_idx').on(t.orgId, t.status)],
)

/**
 * Satu baris = satu aturan. `restriction` membedakan dua model:
 *   ban   → item ini dilarang (weapon, attachment, perk, lethal, tactical, cosmetic)
 *   allow → hanya item terdaftar yang boleh (operator_skill, scorestreak)
 *
 * `itemKey` di-normalisasi (lowercase, spasi tunggal) supaya pencocokan tidak
 * bergantung pada ejaan dokumen sumber; `itemLabel` menyimpan teks aslinya.
 */
export const rulesetRules = pgTable(
  'ruleset_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rulesetId: uuid('ruleset_id')
      .notNull()
      .references(() => rulesets.id, { onDelete: 'cascade' }),
    category: ruleCategory('category').notNull(),
    restriction: restrictionMode('restriction').notNull().default('ban'),
    itemKey: text('item_key').notNull(),
    itemLabel: text('item_label').notNull(),
    scope: jsonb('scope').$type<RuleScope>().notNull().default({}),
    value: jsonb('value').$type<RuleValue>(),
    note: text('note'),
    /** true selama belum diverifikasi manusia — dirender dengan badge "AI draft". */
    needsReview: boolean('needs_review').notNull().default(false),
  },
  (t) => [
    index('ruleset_rules_lookup_idx').on(t.rulesetId, t.category, t.itemKey),
    index('ruleset_rules_review_idx').on(t.rulesetId, t.needsReview),
  ],
)

/** Map pool per mode untuk sebuah ruleset. */
export const rulesetMapPool = pgTable(
  'ruleset_map_pool',
  {
    rulesetId: uuid('ruleset_id')
      .notNull()
      .references(() => rulesets.id, { onDelete: 'cascade' }),
    modeId: uuid('mode_id')
      .notNull()
      .references(() => modes.id, { onDelete: 'cascade' }),
    mapId: uuid('map_id')
      .notNull()
      .references(() => maps.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.rulesetId, t.modeId, t.mapId] })],
)
