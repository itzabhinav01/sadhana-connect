import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@sadhana-connect/auth'
import { initSupabaseClient } from '@sadhana-connect/infra-supabase'
import * as Linking from 'expo-linking'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { env } from '../src/shared/config/env'

initSupabaseClient({
  url: env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  redirectBaseUrl: Linking.createURL('/'),
})

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
