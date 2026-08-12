import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { classRole, locale, orgRole, teamRole } from './enums'

/** Profil user, cermin dari auth.users milik Supabase. */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  preferredLocale: locale('preferred_locale').notNull().default('id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Organisasi = tenant teratas. Maps, ruleset, series format, dan katalog senjata
 * dimiliki di level ini supaya dipakai bersama semua roster.
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orgMembers = pgTable(
  'org_members',
  {
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: orgRole('role').notNull().default('viewer'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.userId] }), index('org_members_user_idx').on(t.userId)],
)

/** Roster. Satu org bisa punya main team, academy, dst. */
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tag: text('tag'),
    logoUrl: text('logo_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('teams_org_idx').on(t.orgId)],
)

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: teamRole('role').notNull().default('player'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.userId] }),
    index('team_members_user_idx').on(t.userId),
  ],
)

/**
 * Pemain di roster. Sengaja dipisah dari `profiles`: seorang pemain bisa dicatat
 * statistiknya tanpa pernah punya akun, dan `userId` menghubungkannya kalau sudah punya.
 */
export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
    ign: text('ign').notNull(),
    /** IGN alternatif — scoreboard CODM sering menampilkan nama ber-tag (`ACE Nan` vs `Nan`). */
    aliases: text('aliases').array().notNull().default(sql`ARRAY[]::text[]`),
    uid: text('uid'),
    avatarUrl: text('avatar_url'),
    /** Role utama untuk tampilan kartu roster; deklarasi resmi per scrim ada di classRoleClaims. */
    primaryRoles: classRole('primary_roles').array().notNull().default(sql`ARRAY[]::class_role[]`),
    isSubstitute: boolean('is_substitute').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('players_team_idx').on(t.teamId),
    uniqueIndex('players_team_ign_idx').on(t.teamId, t.ign),
  ],
)

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    orgRole: orgRole('org_role').notNull().default('viewer'),
    teamRole: teamRole('team_role'),
    token: text('token').notNull().unique(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('invitations_org_email_idx').on(t.orgId, t.email)],
)
