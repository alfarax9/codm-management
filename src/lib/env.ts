import { z } from 'zod'

/**
 * Validasi environment sekali di boot. Kalau ada yang kurang, aplikasi gagal
 * start dengan pesan jelas — bukan error `undefined` di tengah request.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

/**
 * Variabel `NEXT_PUBLIC_*` harus ditulis literal supaya Next.js bisa inline-kan
 * saat build — `process.env[key]` dinamis tidak akan tergantikan di bundle client.
 */
const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

function parse<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Environment variable tidak valid atau belum diisi: ${missing}`)
  }
  return result.data
}

export const clientEnv = parse(clientSchema, publicEnv)

/** Hanya boleh diakses dari server. Import di komponen client akan melempar error. */
export const env = {
  ...clientEnv,
  ...(typeof window === 'undefined'
    ? parse(serverSchema, process.env)
    : ({} as z.infer<typeof serverSchema>)),
}
