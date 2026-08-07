import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 * NEVER import this in client components or expose it to the browser.
 * Use only inside server actions / route handlers that have already
 * verified the caller is authorized (e.g. an owner/manager).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
