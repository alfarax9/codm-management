# CODM Competitive Management — Brainstorm / Design Doc

Status: **DRAFT — belum di-build.** Dokumen ini untuk disepakati dulu.
Tanggal: 2026-08-11

---

## 1. Hasil audit cod-stats.com (referensi)

### 1.1 Hirarki produk

```
Stat TrackR (list team, limit 2 di free)
└── Team Workspace  [Azta • Black Ops 7 • 5v5]
    ├── Dashboard        agregat stats tim
    ├── Matches          match history + create + report scores
    ├── Roster (5)       player card + role badge
    ├── Maps             win-rate per map
    ├── Map Flow      💎 progression hill-by-hill / round-by-round
    ├── Head to Head  💎 performa vs opponent tertentu
    ├── +K/D Losses   💎 map yang K/D positif tapi KALAH
    ├── -K/D Wins     💎 map yang K/D negatif tapi MENANG
    ├── R11           💎 SnD yang sampai round 11 (clutch)
    ├── Map 5s,7s,9s  💎
    ├── Strategies       strategi dari Map Tool
    ├── Share         💎 invite teammate, promote ke Captain
    └── Notes           catatan tim
```

### 1.2 Flow "Create New Match"
Cuma 3 field: **Opponent** (dropdown), **Series Format** (Best of 5 / BO3), **Match Date & Time**.
Catatan mereka: *"Maps and modes will be set when reporting scores."*

### 1.3 Flow "Report Scores" (ini inti produknya)

Modal full-screen, sidebar kiri = daftar map sesuai series format (Map 1/2/3).

Per map:
- **STEP 1: Declare Map Outcome** — Win / Loss / Tie (wajib dulu sebelum input skor)
- **Map** (dropdown) · **Mode** (dropdown) · **Score** (You vs Opp)
- **Auto-fill from screenshot** — AI extraction, kuota `10 of 10 auto-fills left today`
- Sub-tab: **Player Stats** | **Map Flow**

**Kolom Player Stats berubah mengikuti mode** — ini desain kunci:

| Mode | Kolom |
|---|---|
| Hardpoint | KILLS · DEATHS · DAMAGE · **HILL** |
| Search and Destroy | KILLS · DEATHS · DAMAGE · **FB** · **P** · **D** |
| Overload | (mode BO7, tidak relevan buat kita) |

**Map Flow (SnD)** — tabel round-by-round:

| RD | RESULT | ENDED BY | SIDE | US | THEM |
|---|---|---|---|---|---|
| 1 | Win/Loss | Elimination / Bomb Exploded / Bomb Defused / Time Expired | ATK / DEF | 1 | 0 |

### 1.4 Map Tool
Strategy = { name, description, game, map, is_public } → canvas gambar taktik → share ke team.

### 1.5 Yang saya ambil sebagai pelajaran desain
1. **Mode-driven schema.** Kolom stat & struktur "flow" ditentukan oleh mode, bukan hardcode satu tabel gemuk.
2. **Two-step reporting.** Outcome dulu → baru detail. Bikin data nggak setengah jadi.
3. **AI screenshot extraction** adalah fitur yang bikin orang mau pakai. Input manual 5 pemain × 5 map × N scrim = nggak akan dipakai orang.
4. Analitik "kontra-intuitif" (+K/D tapi kalah) = insight paling laku buat coaching.

---

## 2. Gap: apa yang beda untuk CODM

### 2.1 Field scoreboard CODM (dari screenshot Detil Laporan)

**Level match:**
`MENANG 150 : 82` · timestamp `20:10:24 26-08-09` · `HARDPOINT` · `RUSH`
`XP Ranked 36` · `XP Diterima 7566` · `Rasio K/D 0.95` · `Akurasi 17.2%` · `Headshot 5.6%`

**Level pemain** (2 tim × 5, blue/red):
`Rank(1-5)` · `Avatar` · `Nama` · `SKOR` · **`K/D/A`** (3 angka) · **`WAKTU`** (mm:ss) · **`IMPACT`** · badge `MVP` · badge rank tier

**Beda tegas vs cod-stats:**

| cod-stats (BO7) | CODM |
|---|---|
| DAMAGE | ❌ tidak ada di scoreboard CODM |
| — | ✅ **ASSISTS** (bagian dari K/D/A) |
| — | ✅ **SKOR** (score points) |
| — | ✅ **IMPACT** |
| HILL (angka) | ✅ **WAKTU** (format mm:ss) |
| Overload | ❌ → diganti **CONTROL** |
| — | ✅ Akurasi %, Headshot %, MVP flag, placement |

### 2.2 Mode CODM
`HARDPOINT (HP)` · `SEARCH & DESTROY (SND)` · `CONTROL (CTRL)`

### 2.3 Ruleset (dari gambar World Championship 2026)
Ini jauh lebih kaya dari apapun yang cod-stats punya. Kategori restriksi:

- **Gameplay settings per mode** (HP: score 250 / time 600; CTRL: 3 rounds / 90s; SND: 9 wins / 120s / OT cap 20)
- **Map pool per mode** (HP: Summit, Hacienda, Combine, Takeoff, Arsenal · SND: Tunisia, Firing Range, Coastal, Slums, Meltdown · CTRL: Raid, Standoff, Crossroads Strike)
- **Weapon bans** (NA-45, SVD, XPR, SO14, Argus, Shorty, D13 Sector, FHJ-18, SMRS, Thumper)
- **Attachment bans — per senjata** (misal `3-Line Rifle → EMPRESS 514MM F01 Barrel, Bipod, KOVALEVSKAYA S01 Stock`) + global (`All Guns → Thermite/Dragon's Breath/Explosive/Incendiary Ammo`, `All Shotguns → Slug Ammo`, `Weapon Perks all guns → Akimbo, Disable`)
- **Lethal / Tactical bans** (C4, Cluster, Contact, Drill Charge, Molotov, Thermite, Trip Mine / Cryo, Decoy, Douser, Echo, Flash Charge, Flash Drone, Gas, Heartbeat, Inflatable Decoy, Stim Shot, Storm Ball, Trip Sensor)
- **Perk bans per slot warna** (Red / Green / Blue)
- **Wildcards** — semua dilarang
- **Operator Skills — allowlist** (Annihilator, Claw, Death Machine, Equalizer, Gravity Spikes, Gravity Vortex Gun, Purifier, Sparrow, Tempest, War Machine)
- **Scorestreaks — allowlist** (Hunter Killer Drone, Predator Missile, EMP)
- **Cosmetic bans** (legendary utility skins, semua emote, daftar operator skin spesifik)
- **Unique Operator Skill rule** — tidak boleh 2 pemain se-tim pakai operator skill sama di satu match
- **Weapon Class Roles** — 6 role; pool per series = 3 AR, 3 SMG, 1 LMG, 1 Shotgun, 1 Marksman, 1 Sniper; tiap pemain declare 2 role

⚠️ **Penting:** ada dua model restriksi yang beda: **banlist** (weapon/attachment/perk/utility) dan **allowlist** (operator skill/scorestreak). Schema harus mendukung dua-duanya.

---

## 3. Rekomendasi tech stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Server Actions bikin form-heavy app ini ringkas; RSC untuk halaman analitik berat |
| Styling | **Tailwind v4 + shadcn/ui** | Cepat, dark-first, cocok gaya esports |
| DB / Auth / Storage | **Supabase** (Postgres + RLS + Storage + Realtime) | Sesuai permintaan. Storage untuk screenshot scoreboard, gambar map, file ruleset |
| ORM | **Drizzle ORM** | Type-safe, migration file-based, tetap bisa pakai RLS Supabase |
| Data fetching client | **TanStack Query** | Cache untuk dashboard analitik |
| Form + validasi | **react-hook-form + Zod** | Satu skema Zod dipakai client & server |
| Chart | **Recharts** | Cukup, ringan |
| Tabel | **TanStack Table** | Scoreboard editable, sorting, kolom dinamis per mode |
| AI extraction | **Claude API (vision)** — `claude-sonnet-5` default, `claude-opus-5` untuk parsing ruleset | Parsing screenshot scoreboard & dokumen rules |
| Background job | **Supabase Edge Function** atau route handler + queue ringan | Generate weekly analyst report |
| Deploy | **Vercel** | — |

Alternatif yang saya **tidak** rekomendasikan: Prisma (berat di edge), tRPC (Server Actions sudah cukup), NextAuth (Supabase Auth sudah include).

---

## 4. Model data (draft)

### 4.1 Core

```
organizations    id, name, slug, logo_url, owner_id
org_members      org_id, user_id, role(owner|admin|coach|analyst|player|viewer)
teams            id, org_id, name, tag, logo_url, created_at
team_members     team_id, user_id, role(captain|player|analyst|viewer)
players          id, team_id, ign, uid, avatar_url, primary_role, is_substitute, active
invitations      org_id, email, role, token, expires_at, accepted_at
```
Resource **org-level** (dipakai bersama semua tim): `maps`, `modes`, `series_formats`,
`rulesets`, katalog senjata/perk/skill.
Resource **team-level**: `scrims`, `players`, `loadouts`, `weeks`, laporan analyst.

### 4.2 Referensi yang bisa di-extend user

```
modes            id, code(hp|snd|ctrl), name, obj_time_label, stat_columns jsonb
maps             id, name, slug, image_url, minimap_url, uploaded_by, is_official
map_modes        map_id, mode_id            ← map X boleh dipakai di mode Y
series_formats   id, code('232'), label,
                 mode_counts jsonb {hp:2, snd:3, ctrl:2},   ← KUOTA, bukan urutan
                 games_count (= sum), is_active, created_by
```

> `series_formats` = tabel, bukan enum. Nambah format baru = insert row lewat UI.
> Digit ke-1 = jumlah map HP, ke-2 = SND, ke-3 = CTRL.
> **Constraint:** dalam satu scrim, map tidak boleh berulang di dalam mode yang sama.

### 4.3 Scrim & hasil

```
scrims           id, team_id, opponent_id, scheduled_at, series_format_id,
                 ruleset_id, week_id, status(scheduled|live|completed),
                 our_wins, their_wins
scrim_games      id, scrim_id, game_no, map_id, mode_id, result(win|loss|tie),
                 our_score, their_score, played_at,
                 team_accuracy, team_headshot_pct, team_kd_ratio,
                 screenshot_url, extraction_status
game_player_stats  scrim_game_id, player_id, side(us|them), placement,
                   score, kills, deaths, assists, obj_time_seconds,
                   impact, is_mvp
opponent_players   id, opponent_id, ign         ← buat catat roster lawan
```

### 4.4 Flow per mode (mode-specific detail)

```
snd_rounds   scrim_game_id, round_no, result, ended_by
             (elimination|bomb_exploded|bomb_defused|time_expired),
             side(atk|def), our_score, their_score
hp_hills     scrim_game_id, hill_no, hill_name, our_time_s, their_time_s,
             our_score_after, their_score_after
ctrl_rounds  scrim_game_id, round_no, side(atk|def), result,
             our_tickets, their_tickets, objectives_captured
```

### 4.5 Ruleset engine

```
rulesets         id, team_id, name, version, source_file_url, source_type(image|pdf|manual),
                 parsed_raw jsonb, effective_from, status(draft|active|archived)

ruleset_rules    id, ruleset_id,
                 category(weapon|attachment|perk|lethal|tactical|operator_skill|
                          scorestreak|wildcard|cosmetic|gameplay_setting|
                          map_pool|class_role|custom),
                 mode(list|allow),          ← banlist vs allowlist
                 item_key, item_label,
                 scope jsonb,               ← {weapon:'3-Line Rifle'} atau {slot:'red'}
                 value jsonb,               ← untuk gameplay_setting: {score_limit:250}
                 note

ruleset_map_pool ruleset_id, mode_id, map_id
```

**Katalog item** (seed data, bisa ditambah user):
```
weapons        id, name, class(AR|SMG|LMG|Shotgun|Marksman|Sniper|Pistol|Launcher|Melee)
attachments    id, weapon_id(nullable=global), slot, name
perks          id, slot(red|green|blue), name
utilities      id, type(lethal|tactical), name
operator_skills id, name
scorestreaks   id, name, cost
```

### 4.6 Loadout + validasi

```
loadouts          id, player_id, scrim_id(nullable), name,
                  weapon_id, attachment_ids[], perk_ids[],
                  lethal_id, tactical_id, operator_skill_id, scorestreak_ids[]
class_role_claims scrim_id, player_id, roles[]   ← ['AR','SMG']
```

Validasi dijalankan sebagai **pure function** `validateLoadout(loadout, ruleset) → Violation[]`:

```ts
type Violation = {
  severity: 'banned' | 'warning'
  category: string
  itemLabel: string
  reason: string          // "Banned by WC 2026 §Loadout Restrictions"
  path: string            // 'attachments[2]'
}
```

UI: setiap item yang kena violation dirender merah + ikon 🚫 + tooltip alasan. Header loadout kasih badge `3 VIOLATIONS`. Scrim tidak bisa di-set `live` kalau masih ada violation (bisa di-override oleh coach dengan alasan).

Validator tambahan yang berdiri sendiri:
- `validateUniqueOperatorSkill(team_loadouts)` — no duplicate dalam satu match
- `validateClassRolePool(class_role_claims)` — harus persis 3 AR / 3 SMG / 1 LMG / 1 Shotgun / 1 Marksman / 1 Sniper
- `validateMapPool(scrim_games, ruleset)` — map di luar pool → warning

### 4.7 Analyst

```
weeks               id, team_id, label('W32 2026'), start_date, end_date
analyst_assignments id, team_id, analyst_user_id,
                    scope(scrim|week), scrim_id|week_id,
                    player_id(nullable = seluruh tim), status(pending|done)

player_reviews      id, assignment_id, player_id, scrim_game_id(nullable),
                    ratings jsonb {slaying, objective, consistency, utility, comms},
                    strengths text[], weaknesses text[], notes,
                    author_id, source(human|ai)

weekly_reports      id, team_id, week_id, player_id,
                    metrics jsonb,        ← agregat terhitung
                    deltas jsonb,         ← vs minggu lalu
                    grade, summary, generated_at
```

---

## 5. Fitur yang kamu minta — usulan implementasi

### 5.1 Scrim Format (111/122/232/…) — DIKONFIRMASI

Kode 3-digit = **kuota map per mode**, urutan posisi `HP · SND · CTRL`:

```
232  →  2 map Hardpoint  +  3 map Search & Destroy  +  2 map Control  =  7 game
```

Aturan turunan: **map tidak boleh berulang di dalam mode yang sama**
(2 HP = 2 map HP berbeda; 3 SND = 3 map SND berbeda).

Seed dari daftarmu (12 unik, `122` tercatat dobel):

| Kode | HP | SND | CTRL | Total |
|---|---|---|---|---|
| 111 | 1 | 1 | 1 | 3 |
| 211 | 2 | 1 | 1 | 4 |
| 122 | 1 | 2 | 2 | 5 |
| 212 | 2 | 1 | 2 | 5 |
| 123 | 1 | 2 | 3 | 6 |
| 132 | 1 | 3 | 2 | 6 |
| 222 | 2 | 2 | 2 | 6 |
| 231 | 2 | 3 | 1 | 6 |
| 321 | 3 | 2 | 1 | 6 |
| 322 | 3 | 2 | 2 | 7 |
| 331 | 3 | 3 | 1 | 7 |
| 333 | 3 | 3 | 3 | 9 |

**Format Builder UI:** stepper `HP [2] SND [3] CTRL [2]` → preview `232 · 7 game` → simpan.
Karena `mode_counts` itu jsonb dan mode-nya sendiri ada di tabel `modes`, kalau nanti
CODM nambah mode baru (mis. Domination) tinggal tambah key — tidak perlu ganti kode.

**Konsekuensi di UI Report Scores:**
- Sidebar map digenerate dari kuota, dikelompokkan per mode:
  `HARDPOINT (2)` → Map 1, Map 2 · `SND (3)` → Map 3, 4, 5 · `CONTROL (2)` → Map 6, 7
- Dropdown map tiap slot **otomatis menyembunyikan map yang sudah dipakai di mode itu**
- Dropdown map juga difilter oleh `map_modes` (map X memang dimainkan di mode Y)
  dan oleh `ruleset_map_pool` kalau scrim terikat ruleset
- Validator `validateNoDuplicateMapPerMode(scrim)` jalan sebelum scrim bisa di-complete

### 5.2 Halaman Rules (upload + interpretasi)

Flow yang saya usulkan:

```
1. UPLOAD    drag & drop gambar/PDF ruleset → Supabase Storage
2. PARSE     Claude vision → JSON terstruktur (draft, ditandai "AI-generated")
3. REVIEW    halaman review: kategori per kategori, tiap item bisa
             edit / hapus / tambah manual. Ini WAJIB — jangan pernah
             percaya 100% hasil parsing untuk aturan turnamen.
4. ACTIVATE  ruleset jadi status=active, dapat versi
5. APPLY     scrim pilih ruleset → semua loadout & map divalidasi terhadapnya
```

Halaman **Rules Viewer** menampilkan hasil terstruktur:
- Tab per kategori (Weapons / Attachments / Perks / Utility / Operator Skills / Scorestreaks / Cosmetics / Gameplay Settings / Map Pool / Class Roles)
- Search bar: ketik "Argus" → langsung tahu `🚫 BANNED — Shotguns`
- Badge hijau `ALLOWED` / merah `BANNED` / kuning `CONDITIONAL`

### 5.3 Tanda merah di roster/loadout
Sudah dijelaskan di §4.6. Tambahan: **Team Compliance Panel** di halaman scrim —
matrix 5 pemain × kategori, sel merah kalau ada pelanggaran, klik → detail.

### 5.4 Map upload
Halaman **Maps** dengan:
- Grid map + gambar
- Tombol `Upload Map`: nama, slug, gambar map, minimap (buat Strategy Board nanti), centang mode mana saja yang pakai map ini
- Toggle `official` vs `custom`
- Map pool per ruleset di-set dari sini

### 5.5 Scoreboard AI extraction (CODM)
Upload screenshot Detil Laporan → Claude vision → JSON:
```json
{
  "result": "win", "our_score": 150, "their_score": 82,
  "mode": "hardpoint", "map": "Rush",
  "played_at": "2026-08-09T20:10:24",
  "team": { "kd_ratio": 0.95, "accuracy": 17.2, "headshot_pct": 5.6 },
  "players": [
    { "side":"us","placement":1,"ign":"Lav1nnTT","score":3874,
      "kills":26,"deaths":17,"assists":11,"obj_time":"01:30",
      "impact":192,"is_mvp":true }
  ]
}
```
→ tampil di **review table** sebelum disimpan (sel yang low-confidence dikuning-in),
→ auto-match IGN ke roster (fuzzy match, karena tag tim sering berubah: `ACE Nan` vs `Nan`).

### 5.6 Analyst assignment + Analyst Performance

**Assignment:**
- Per scrim: di halaman scrim, `Assign Analyst` → pilih member ber-role analyst → opsional fokus ke 1 pemain
- Per minggu: halaman `Weeks`, tiap minggu bisa assign analyst (bisa lebih dari 1, bagi per pemain)
- Analyst punya inbox `My Assignments` (pending / done)

**Analyst Performance Report (mingguan per roster):**

Metrik yang dihitung otomatis dari `game_player_stats`:

| Kategori | Metrik |
|---|---|
| Slaying | K/D, kills/game, deaths/game, engagement win rate proxy |
| Objective | obj_time/game (HP), plants+defuses (SND), tickets (CTRL) |
| Impact | avg impact, avg score, MVP rate |
| Consistency | stdev K/D antar map, worst-game floor |
| Mode split | performa per mode (HP vs SND vs CTRL) |
| Map split | best/worst map |
| Contra-insight | game K/D positif tapi kalah, dan sebaliknya |

Output halaman **Weekly Analyst Report**:
- Header: minggu, record W-L, analyst yang bertugas
- Kartu per pemain: grade (S/A/B/C/D), radar chart 5 sumbu, delta vs minggu lalu (↑↓), 3 strength + 3 weakness
- Bagian tim: mode mana yang paling lemah, map mana yang harus di-ban
- Sumber teks: **gabungan** — angka & grade dihitung deterministik (bisa diaudit), narasi ditulis analyst manusia, dengan tombol `Draft with AI` yang mengisi draft dari angka-angka itu

---

## 6. Rencana bertahap (usulan)

| Fase | Isi |
|---|---|
| **0** | Setup: Next.js + Supabase + Drizzle + auth + shadcn, schema core |
| **1** | Team, Roster, Maps (+upload), Modes, Series Format builder |
| **2** | Scrim CRUD + Report Scores (manual input, kolom dinamis per mode) |
| **3** | Mode flow: SnD rounds, HP hills, CTRL rounds |
| **4** | AI scoreboard extraction + review table |
| **5** | Ruleset: upload → parse → review → activate → Rules Viewer |
| **6** | Loadout builder + validator + compliance panel (tanda merah) |
| **7** | Analytics dashboard (map stats, H2H, +K/D losses, mode split) |
| **8** | Analyst assignment + weekly report |
| **9** | Strategy board (canvas di atas minimap) — opsional, paling akhir |

---

## 7. Keputusan yang sudah diambil

| # | Topik | Keputusan |
|---|---|---|
| 1 | Kode format | Kuota map per mode, posisi `HP·SND·CTRL`. `232` = 2 HP + 3 SND + 2 CTRL = 7 game. Map unik per mode. |
| 2 | Scope user | **Multi-team dalam satu organisasi**, tertutup (invite-only). Ada `organizations` di atas `teams`; RLS per org + per team. Tidak ada registrasi publik, tidak ada billing. |
| 3 | Ruleset parsing | **AI-draft + review manual.** Claude vision → JSON draft → halaman review per kategori → activate. |
| 4 | Analyst report | **Angka deterministik + narasi analyst**, dengan tombol `Draft with AI` yang mengisi draft dari metrik. |
| 5 | Urutan game | **Bebas.** Format hanya menentukan kuota; tiap game slot memilih mode dari sisa kuota yang tersedia. |
| 6 | Bahasa UI | **Indonesia + Inggris**, bisa diganti user (i18n dengan `next-intl`, preferensi disimpan per user). |

### Dampak keputusan #5 — urutan game bebas

`scrim_games.game_no` tetap urut 1..N, tapi `mode_id` **tidak** ditentukan di depan.
Saat mengisi game slot, UI menampilkan sisa kuota dan hanya mengizinkan mode yang masih ada jatahnya:

```
Format 232  →  HP 2 · SND 3 · CTRL 2
Game 1: [SND ▾]  sisa → HP 2 · SND 2 · CTRL 2
Game 2: [HP  ▾]  sisa → HP 1 · SND 2 · CTRL 2
Game 3: [SND ▾]  sisa → HP 1 · SND 1 · CTRL 2
...
```

Dua pure function yang mengatur ini:
```ts
remainingQuota(format, games)          → Record<ModeCode, number>
availableModes(format, games, gameNo)  → ModeCode[]   // yang sisa kuotanya > 0
availableMaps(mode, games, mapPool)    → Map[]        // minus map terpakai di mode itu
```
Scrim baru bisa `completed` kalau semua kuota terpakai habis dan tidak ada map duplikat per mode.

### Dampak keputusan #2 pada schema

```
organizations   id, name, slug, logo_url, owner_id
org_members     org_id, user_id, role(owner|admin|coach|analyst|player|viewer)
teams           id, org_id, name, tag, logo_url          ← main / academy / dst
team_members    team_id, user_id, role(captain|player|analyst|viewer)
invitations     org_id, email, role, token, expires_at, accepted_at
```

Ruleset, maps, series_formats, dan katalog senjata di-scope ke **org** (dipakai bersama
semua tim), sedangkan scrim, roster, loadout, dan report di-scope ke **team**.

---

## 8. Pertanyaan tersisa (tidak memblokir Fase 0–2)

1. **Loadout** — tiap pemain isi sendiri di app, atau coach yang input semua?
   *Default sementara:* keduanya boleh — pemain isi punyanya sendiri, coach/captain bisa edit semua.
2. **Data lawan** — perlu simpan stat pemain lawan (scouting), atau cukup skor tim?
   *Default sementara:* schema sudah menyiapkan `opponent_players` + `game_player_stats.side`,
   tapi UI input-nya opsional (bisa dilewati).

---

## 9. Konvensi kode

- **Feature-first**, bukan type-first. Tiap modul di `src/features/<nama>/` berisi
  `components/`, `queries.ts` (read, server), `actions.ts` (write, Server Action),
  `schema.ts` (Zod, dipakai client & server).
- `src/components/ui/` **hanya** primitif shadcn. Komponen milik satu fitur tinggal di fiturnya.
- Logika aturan (validator loadout, kuota format, agregasi metrik) ditulis sebagai
  **pure function** di `src/lib/rules/` dan `src/lib/metrics/` — tanpa akses DB,
  supaya bisa dites tanpa database dan dipakai ulang di client maupun server.
- Query DB **hanya** di `queries.ts` / `actions.ts`. Komponen tidak pernah import `db` langsung.
- Zod schema satu sumber; tipe TypeScript diturunkan dengan `z.infer`, bukan ditulis ulang.
- Tidak ada barrel file `index.ts` yang re-export segalanya (bikin bundle bengkak
  dan circular import) — kecuali `src/db/schema/index.ts` yang memang dibutuhkan Drizzle.
- Teks UI tidak pernah hardcode; semua lewat `next-intl` (`messages/id.json`, `messages/en.json`).
