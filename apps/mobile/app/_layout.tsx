import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@sadhana-connect/auth'
import { initSupabaseClient } from '@sadhana-connect/infra-supabase'
import * as Linking from 'expo-linking'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { ThemeProvider } from '../src/application/theme/theme-provider'
import { useTheme } from '../src/application/theme/use-theme'
import { secureSessionStorage } from '../src/infrastructure/local-storage/secure-session-storage'
import { env } from '../src/shared/config/env'

initSupabaseClient({
  url: env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  auth: {
    storage: secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  redirectBaseUrl: Linking.createURL('/'),
})

const queryClient = new QueryClient()

// StatusBar "style" names the color of its content (icons/clock), not the
// background — "light" content for a dark screen, "dark" content for a
// light one.
function ThemedStatusBar() {
  const { resolvedTheme } = useTheme()
  return <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <ThemedStatusBar />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
