# CODM Management

Manajemen scrim, statistik, dan analisis untuk tim kompetitif Call of Duty Mobile.
Desain lengkap ada di [docs/BRAINSTORM.md](docs/BRAINSTORM.md).

## Menjalankan

```bash
cp .env.example .env.local   # isi kredensial Supabase
npm install
npm run db:migrate           # tabel + RLS + trigger + bucket Storage
npm run dev
```

Pakai `db:migrate`, bukan `db:push`. `db:push` menyamakan tabel dengan schema
Drizzle tapi **melewati file migrasi custom** — artinya seluruh policy RLS,
trigger `auth.users` → `profiles`, dan bucket Storage tidak akan terpasang.

Organisasi yang dibuat lewat aplikasi otomatis terisi data referensi (mode,
format scrim, map pool, katalog senjata, ruleset WC 2026). Untuk mengisi ulang
organisasi lama:

```bash
npm run db:seed -- <org-id>
```

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm test` | Unit test rule engine |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Buat file migrasi SQL dari schema |
| `npm run db:push` | Terapkan schema langsung ke database |
| `npm run db:studio` | Drizzle Studio |

## Struktur

```
docs/                      dokumen desain
drizzle/                   migrasi SQL hasil generate
messages/                  terjemahan UI — id.json, en.json
src/
├── app/                   route Next.js (App Router)
│   ├── (app)/             halaman di balik login, pakai sidebar
│   └── login/             halaman publik
├── components/            komponen lintas fitur
├── db/
│   ├── schema/            definisi tabel Drizzle, dipecah per domain
│   ├── seed/              data referensi + skrip seeding
│   └── index.ts           koneksi database
├── features/              modul per fitur (components/, queries.ts, actions.ts, schema.ts)
├── i18n/                  konfigurasi & aksi ganti bahasa
├── lib/
│   ├── metrics/           perhitungan statistik pemain — pure function
│   ├── rules/             rule engine format & loadout — pure function
│   ├── supabase/          client server & browser
│   ├── env.ts             validasi environment
│   └── format.ts          formatter (durasi, K/D/A, cn)
├── types/                 tipe domain lintas layer
└── proxy.ts               refresh sesi Supabase + proteksi route
```

## Aturan main di kode

- **Feature-first.** Modul fitur berisi `components/`, `queries.ts` (baca),
  `actions.ts` (tulis), `schema.ts` (Zod). Komponen tidak pernah `import { db }`.
- **Logika aturan itu pure function.** Validator loadout, kuota format, dan
  agregasi metrik tidak menyentuh database, jadi bisa dijalankan di server maupun
  di browser dan diuji tanpa koneksi.
- **Satu sumber tipe.** Skema Zod ditulis sekali, tipe TypeScript diturunkan
  dengan `z.infer`.
- **Tidak ada teks hardcode.** Semua lewat `next-intl`.

## Rule engine

Dua bagian yang paling menentukan perilaku aplikasi, keduanya di `src/lib/rules/`
dan tercakup unit test:

**Format scrim** (`format.ts`) — kode 3 digit adalah kuota map per mode dengan
urutan `HP · SND · CTRL`. `232` berarti 2 map Hardpoint, 3 map Search & Destroy,
2 map Control — total 7 game. Urutan main bebas; tiap slot memilih mode dari sisa
kuota, dan map tidak boleh berulang di dalam mode yang sama.

**Loadout** (`loadout.ts`, `ruleset.ts`) — ruleset dikompilasi jadi indeks lalu
dipakai memvalidasi lima loadout sekaligus. Mendukung dua model restriksi:
`ban` (senjata, attachment, perk, utility) dan `allow` (operator skill,
scorestreak — semua di luar daftar dilarang). Aturan ber-scope ditangani, mis.
attachment yang hanya dilarang di satu senjata atau di satu kelas senjata.
Ditambah dua validator berdiri sendiri: operator skill unik per tim, dan pool
weapon class role 3 AR / 3 SMG / 1 LMG / 1 Shotgun / 1 Marksman / 1 Sniper.
