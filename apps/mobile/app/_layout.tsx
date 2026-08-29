import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@sadhana-connect/auth'
import { initSupabaseClient } from '@sadhana-connect/infra-supabase'
import * as Linking from 'expo-linking'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Text, TextInput } from 'react-native'

import { ThemeProvider } from '../src/application/theme/theme-provider'
import { useTheme } from '../src/application/theme/use-theme'
import { dailySadhanaNotificationService } from '../src/infrastructure/notifications/daily-sadhana-notification-service'
import { secureSessionStorage } from '../src/infrastructure/local-storage/secure-session-storage'
import { env } from '../src/shared/config/env'
import { fontFamily } from '../src/shared/theme'

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

// React Native still honors this legacy defaultProps hook on its own
// built-in host components — the only way to apply a default font to
// every <Text>/<TextInput> already scattered across ~40 screens without
// touching each one. An explicit fontFamily set on an individual style
// still wins: RN merges a style array left-to-right, most-specific last,
// and this is always prepended, never appended. Applied exactly once
// (guarded by the module-level flag), the first time fonts finish
// loading.
let defaultFontApplied = false

function applyDefaultFontOnce() {
  if (defaultFontApplied) return
  defaultFontApplied = true

  const TextWithDefaults = Text as unknown as { defaultProps?: { style?: unknown } }
  TextWithDefaults.defaultProps = TextWithDefaults.defaultProps ?? {}
  TextWithDefaults.defaultProps.style = [
    { fontFamily: fontFamily.regular },
    TextWithDefaults.defaultProps.style,
  ]

  const TextInputWithDefaults = TextInput as unknown as { defaultProps?: { style?: unknown } }
  TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps ?? {}
  TextInputWithDefaults.defaultProps.style = [
    { fontFamily: fontFamily.regular },
    TextInputWithDefaults.defaultProps.style,
  ]
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  const router = useRouter()

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFontOnce()
    }
    if (fontError) {
      // eslint-disable-next-line no-console -- worth surfacing in the
      // Metro/logcat log even though it's not user-facing; the app
      // itself degrades to the system font rather than failing to load.
      console.warn('Poppins failed to load, falling back to the system font:', fontError)
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    dailySadhanaNotificationService.initHandler()
    const unsubscribe = dailySadhanaNotificationService.subscribeNotificationResponse((url) => {
      router.push(url as never)
    })
    return () => unsubscribe()
  }, [router])

  // Poppins is a small, locally-bundled asset (no network fetch), so this
  // resolves in well under a frame in the normal case — a blank screen
  // rather than a whole splash-screen dependency for a flash too brief to
  // ever see. If loading ever errors out instead of resolving, this must
  // NOT block forever: fall through to rendering with the system font
  // rather than leaving the app on a permanent blank screen.
  if (!fontsLoaded && !fontError) {
    return null
  }

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
