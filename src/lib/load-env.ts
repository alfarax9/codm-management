import { config } from 'dotenv'

/**
 * Pemuat environment untuk skrip CLI (`db:check`, `db:seed`).
 *
 * Next.js membaca `.env.local` sendiri, tapi skrip yang dijalankan lewat tsx
 * tidak. `dotenv/config` bawaan hanya membaca `.env`, sehingga kredensial di
 * `.env.local` terlewat dan skrip gagal dengan pesan environment tidak valid.
 *
 * Urutan berarti: berkas pertama yang mendefinisikan sebuah variabel menang,
 * jadi `.env.local` menimpa `.env`.
 */
config({ path: ['.env.local', '.env'], quiet: true })
