import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSupabaseClient } from '@sadhana-connect/infra-supabase/client'

import { App } from '@/app/App'
import { env } from '@/shared/config/env'

import './index.css'

initSupabaseClient({
  url: env.VITE_SUPABASE_URL,
  anonKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  redirectBaseUrl: window.location.origin,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
