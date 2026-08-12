import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/lib/env'

/**
 * Client Supabase untuk Server Component, Server Action, dan Route Handler.
 * Selalu dibuat baru per request — instance-nya membawa cookie sesi user,
 * jadi tidak boleh di-cache antar request.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Component tidak boleh menulis cookie. Middleware yang menyegarkan
          // sesi, jadi kegagalan di sini aman diabaikan.
        }
      },
    },
  })
}

/** User yang sedang login, atau null. */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
