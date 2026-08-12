import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import type { ModeQuota, StatColumn } from '@/types/domain'

import { perkSlot, utilityType, weaponClass } from './enums'
import { organizations, profiles } from './org'

/**
 * Mode permainan. Tabel, bukan enum — supaya mode baru bisa ditambah lewat UI
 * tanpa migrasi. Seed: hp, snd, ctrl.
 */
export const modes = pgTable('modes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  /** Label kolom waktu objektif: "Hill Time" untuk HP, "Zone Time" untuk CTRL. */
  objTimeLabelKey: text('obj_time_label_key'),
  /** Kolom stat pemain yang dirender untuk mode ini. */
  statColumns: jsonb('stat_columns').$type<StatColumn[]>().notNull().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
})

export const maps = pgTable(
  'maps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    imageUrl: text('image_url'),
    /** Denah top-down untuk Strategy Board. */
    minimapUrl: text('minimap_url'),
    /** Map bawaan CODM vs map yang ditambahkan sendiri. */
    isOfficial: boolean('is_official').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    uploadedBy: uuid('uploaded_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('maps_org_slug_idx').on(t.orgId, t.slug)],
)

/** Map mana dimainkan di mode mana. Menentukan isi dropdown map saat report score. */
export const mapModes = pgTable(
  'map_modes',
  {
    mapId: uuid('map_id')
      .notNull()
      .references(() => maps.id, { onDelete: 'cascade' }),
    modeId: uuid('mode_id')
      .notNull()
      .references(() => modes.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.mapId, t.modeId] })],
)

/**
 * Format scrim. `code` adalah notasi digit berurutan mengikuti `modes.sortOrder`
 * (posisi 1 = HP, 2 = SND, 3 = CTRL), nilainya = jumlah map untuk mode itu.
 *
 * `232` → modeQuota `{ hp: 2, snd: 3, ctrl: 2 }` → gamesCount 7.
 *
 * Urutan main BEBAS: format hanya menentukan kuota, tiap game slot memilih mode
 * dari sisa kuota yang masih tersedia.
 */
export const seriesFormats = pgTable(
  'series_formats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    label: text('label'),
    modeQuota: jsonb('mode_quota').$type<ModeQuota>().notNull(),
    /** Denormalisasi dari jumlah modeQuota — dipakai untuk sort & filter. */
    gamesCount: integer('games_count').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('series_formats_org_code_idx').on(t.orgId, t.code)],
)

// ---------------------------------------------------------------------------
// Katalog item loadout. Jadi acuan `ruleset_rules.itemKey` dan isian loadout.
// ---------------------------------------------------------------------------

export const weapons = pgTable(
  'weapons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    class: weaponClass('class').notNull(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [
    uniqueIndex('weapons_org_name_idx').on(t.orgId, t.name),
    index('weapons_class_idx').on(t.orgId, t.class),
  ],
)

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    /** Null = attachment global (mis. ammo type yang ada di banyak senjata). */
    weaponId: uuid('weapon_id').references(() => weapons.id, { onDelete: 'cascade' }),
    slot: text('slot'),
    name: text('name').notNull(),
  },
  (t) => [index('attachments_org_weapon_idx').on(t.orgId, t.weaponId)],
)

export const perks = pgTable(
  'perks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    slot: perkSlot('slot').notNull(),
    name: text('name').notNull(),
  },
  (t) => [uniqueIndex('perks_org_slot_name_idx').on(t.orgId, t.slot, t.name)],
)

export const utilities = pgTable(
  'utilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    type: utilityType('type').notNull(),
    name: text('name').notNull(),
  },
  (t) => [uniqueIndex('utilities_org_type_name_idx').on(t.orgId, t.type, t.name)],
)

export const operatorSkills = pgTable(
  'operator_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => [uniqueIndex('operator_skills_org_name_idx').on(t.orgId, t.name)],
)

export const scorestreaks = pgTable(
  'scorestreaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    cost: integer('cost'),
  },
  (t) => [uniqueIndex('scorestreaks_org_name_idx').on(t.orgId, t.name)],
)
