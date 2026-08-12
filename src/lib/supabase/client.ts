import { createBrowserClient } from '@supabase/ssr'

import { clientEnv } from '@/lib/env'

/** Client Supabase untuk komponen browser — upload file dan langganan realtime. */
export function createClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
