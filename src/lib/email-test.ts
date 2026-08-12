import '@/lib/load-env'
import { Resend } from 'resend'

/**
 * Uji kirim satu email lewat Resend:
 *
 *   npm run email:test -- nama@email.com
 *
 * Dipakai untuk memastikan RESEND_API_KEY dan EMAIL_FROM benar sebelum fitur
 * yang mengandalkannya dibangun.
 */
async function main(to: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY belum diisi di .env.local')

  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
  console.log(`Mengirim dari ${from} ke ${to}…`)

  const { data, error } = await new Resend(apiKey).emails.send({
    from,
    to,
    subject: 'CODM Management — uji kirim',
    html: '<p>Kalau email ini sampai, konfigurasi Resend sudah benar.</p>',
  })

  if (error) {
    console.error(`\n✗ Gagal: ${error.message}`)
    if (from.endsWith('@resend.dev')) {
      console.error(
        '\n  Alamat onboarding@resend.dev hanya boleh mengirim ke email pemilik\n' +
          '  akun Resend. Untuk mengirim ke orang lain, verifikasi domain sendiri\n' +
          '  di resend.com/domains lalu ubah EMAIL_FROM.',
      )
    }
    process.exit(1)
  }

  console.log(`\n✓ Terkirim — id ${data?.id}`)
}

const to = process.argv[2]
if (!to) {
  console.error('Pemakaian: npm run email:test -- nama@email.com')
  process.exit(1)
}

main(to).catch((error) => {
  console.error(error instanceof Error ? `\n✗ ${error.message}` : error)
  process.exit(1)
})
