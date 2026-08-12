import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Gambar map dan avatar disajikan dari Supabase Storage.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' }],
  },
  experimental: {
    // Screenshot scoreboard dikirim lewat Server Action; default 1MB terlalu kecil.
    serverActions: { bodySizeLimit: '8mb' },
  },
}

export default withNextIntl(nextConfig)
