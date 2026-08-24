import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js'

export interface SupabaseClientConfig {
  url: string
  anonKey: string
  auth?: SupabaseClientOptions<'public'>['auth']
}

let client: SupabaseClient | undefined

// Each app (web today, mobile later) calls this once at startup with its own
// env source and storage adapter — a package can't read import.meta.env
// (Vite-only) and web/native need different session-storage backends, so the
// client can't be a module-level singleton built at import time anymore.
export function initSupabaseClient(config: SupabaseClientConfig): void {
  client = createClient(config.url, config.anonKey, { auth: config.auth })
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client not initialized — call initSupabaseClient() first')
  }
  return client
}
