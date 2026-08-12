import '@/lib/load-env'
import { sql } from 'drizzle-orm'

import { db } from '.'
import { withRls } from './rls'

/**
 * Pemeriksaan kesehatan database:
 *
 *   npm run db:check
 *
 * Menjawab pertanyaan yang tidak bisa dijawab dengan melihat tabel saja —
 * apakah RLS benar-benar menyala, apakah policy terpasang, dan yang paling
 * penting: apakah `withRls()` sungguh membatasi query, bukan cuma terlihat rapi
 * di kode.
 */

const APP_TABLES = [
  'profiles', 'organizations', 'org_members', 'teams', 'team_members', 'players',
  'invitations', 'modes', 'maps', 'map_modes', 'series_formats', 'weapons',
  'attachments', 'perks', 'utilities', 'operator_skills', 'scorestreaks',
  'rulesets', 'ruleset_rules', 'ruleset_map_pool', 'loadouts', 'class_role_claims',
  'opponents', 'opponent_players', 'scrims', 'scrim_games', 'game_player_stats',
  'snd_rounds', 'hp_hills', 'ctrl_rounds', 'weeks', 'analyst_assignments',
  'player_reviews', 'weekly_reports',
]

const ok = (label: string, detail = '') => console.log(`  ✓ ${label}${detail && ` — ${detail}`}`)
const bad = (label: string, detail = '') => {
  console.log(`  ✗ ${label}${detail && ` — ${detail}`}`)
  failures += 1
}

let failures = 0

async function checkTables() {
  console.log('\nTabel & RLS')

  const rows = await db.execute<{ tablename: string; rowsecurity: boolean; policies: number }>(sql`
    SELECT c.relname AS tablename,
           c.relrowsecurity AS rowsecurity,
           count(p.polname)::int AS policies
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    GROUP BY c.relname, c.relrowsecurity
  `)

  const byName = new Map(rows.map((r) => [r.tablename, r]))
  const missing = APP_TABLES.filter((t) => !byName.has(t))
  const rlsOff = APP_TABLES.filter((t) => byName.get(t) && !byName.get(t)?.rowsecurity)
  const noPolicy = APP_TABLES.filter((t) => byName.get(t)?.rowsecurity && byName.get(t)?.policies === 0)

  if (missing.length) bad(`${missing.length} tabel belum ada`, missing.join(', '))
  else ok(`${APP_TABLES.length} tabel aplikasi ada`)

  if (rlsOff.length) bad(`RLS mati di ${rlsOff.length} tabel`, rlsOff.join(', '))
  else ok('RLS menyala di semua tabel')

  if (noPolicy.length) bad(`${noPolicy.length} tabel tanpa policy (akan menolak semua akses)`, noPolicy.join(', '))
  else ok(`Total ${rows.reduce((n, r) => n + r.policies, 0)} policy terpasang`)
}

async function checkFunctions() {
  console.log('\nHelper & trigger')

  const expected = [
    'user_org_ids', 'is_org_member', 'can_manage_org', 'is_org_admin',
    'team_org_id', 'can_manage_team', 'can_read_team', 'player_team_id',
    'scrim_team_id', 'game_team_id', 'ruleset_org_id', 'handle_new_user',
  ]

  const rows = await db.execute<{ proname: string }>(sql`
    SELECT p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  `)
  const names = new Set(rows.map((r) => r.proname))
  const missing = expected.filter((fn) => !names.has(fn))

  if (missing.length) bad(`${missing.length} fungsi helper belum ada`, missing.join(', '))
  else ok(`${expected.length} fungsi helper ada`)

  const triggers = await db.execute<{ tgname: string }>(sql`
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal
  `)
  const tgNames = triggers.map((t) => t.tgname)
  if (tgNames.includes('on_auth_user_created')) ok('Trigger auth.users → profiles aktif')
  else bad('Trigger on_auth_user_created belum ada', 'user baru akan gagal karena foreign key')
}

async function checkStorage() {
  console.log('\nStorage')

  const buckets = await db.execute<{ id: string; public: boolean }>(
    sql`SELECT id, public FROM storage.buckets`,
  )
  const ids = new Set(buckets.map((b) => b.id))

  for (const expected of ['map-images', 'scoreboards', 'rulesets']) {
    if (ids.has(expected)) ok(`Bucket ${expected}`, buckets.find((b) => b.id === expected)?.public ? 'publik' : 'privat')
    else bad(`Bucket ${expected} belum ada`)
  }
}

async function checkSeed() {
  console.log('\nData referensi')

  const counts = await db.execute<{ label: string; n: number }>(sql`
    SELECT 'organizations' AS label, count(*)::int AS n FROM organizations
    UNION ALL SELECT 'modes', count(*)::int FROM modes
    UNION ALL SELECT 'series_formats', count(*)::int FROM series_formats
    UNION ALL SELECT 'maps', count(*)::int FROM maps
    UNION ALL SELECT 'rulesets', count(*)::int FROM rulesets
    UNION ALL SELECT 'ruleset_rules', count(*)::int FROM ruleset_rules
  `)

  for (const row of counts) {
    if (row.n > 0) ok(row.label, String(row.n))
    else console.log(`  · ${row.label} — kosong`)
  }
}

/**
 * Bagian terpenting. RLS bisa saja menyala dan policy-nya lengkap, tapi tetap
 * tidak berpengaruh kalau query dijalankan sebagai pemilik database. Tes ini
 * membuktikan `withRls()` benar-benar menurunkan hak akses: user acak yang bukan
 * anggota organisasi mana pun harus melihat NOL baris, sementara koneksi
 * administratif melihat semuanya.
 */
async function checkRlsEnforcement() {
  console.log('\nPenegakan RLS')

  const [{ n: total }] = await db.execute<{ n: number }>(
    sql`SELECT count(*)::int AS n FROM organizations`,
  )

  if (total === 0) {
    console.log('  · Dilewati — belum ada organisasi. Buat satu lewat aplikasi, lalu ulangi.')
    return
  }

  const strangerId = '00000000-0000-0000-0000-000000000000'
  const visible = await withRls(strangerId, (tx) =>
    tx.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM organizations`),
  )
  const seen = visible[0].n

  if (seen === 0) ok('User non-anggota melihat 0 organisasi', `koneksi admin melihat ${total}`)
  else bad(`RLS TIDAK menahan akses — user non-anggota melihat ${seen} organisasi`,
           'query aplikasi berjalan dengan hak yang melewati policy')
}

async function main() {
  const [{ version }] = await db.execute<{ version: string }>(sql`SELECT version()`)
  console.log(`Terhubung — ${version.split(',')[0]}`)

  await checkTables()
  await checkFunctions()
  await checkStorage()
  await checkSeed()
  await checkRlsEnforcement()

  console.log(
    failures === 0
      ? '\nSemua pemeriksaan lolos.\n'
      : `\n${failures} pemeriksaan gagal — lihat tanda ✗ di atas.\n`,
  )
  return failures
}

main()
  .then((f) => process.exit(f === 0 ? 0 : 1))
  .catch((error) => {
    const host = process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? '(tidak diset)'
    console.error(`\n✗ Tidak bisa terhubung ke database di ${host}\n`)
    console.error('  Periksa DATABASE_URL di .env.local. Ambil dari Supabase:')
    console.error('  Project Settings → Database → Connection string → Transaction pooler.\n')
    console.error(error instanceof Error ? `  ${error.message}\n` : error)
    process.exit(1)
  })
