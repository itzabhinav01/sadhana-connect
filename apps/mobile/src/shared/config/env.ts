import { z } from 'zod'

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

const FALLBACK_SUPABASE_URL = 'https://snyqgzkenzsxsrrgobxy.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_APPnQELJQUAo6lWYGroDKg_8_ixLYTL'

function loadEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY

  const parsed = envSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: url,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  })

  if (!parsed.success) {
    return {
      EXPO_PUBLIC_SUPABASE_URL: FALLBACK_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: FALLBACK_SUPABASE_ANON_KEY,
    }
  }

  return parsed.data
}

export const env = loadEnv()
