import AsyncStorage from '@react-native-async-storage/async-storage'
import { initSupabaseClient, getSupabaseClient } from '@sadhana-connect/infra-supabase'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { env } from './src/shared/config/env'

initSupabaseClient({
  url: env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

type ConnectionStatus =
  | { state: 'checking' }
  | { state: 'connected'; email: string | null }
  | { state: 'error'; message: string }

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>({ state: 'checking' })

  useEffect(() => {
    let cancelled = false

    getSupabaseClient()
      .auth.getSession()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setStatus({ state: 'error', message: error.message })
          return
        }
        setStatus({ state: 'connected', email: data.session?.user.email ?? null })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sadhana Connect</Text>
      {status.state === 'checking' && <Text>Connecting to Supabase…</Text>}
      {status.state === 'connected' && (
        <Text>
          {status.email
            ? `Connected — signed in as ${status.email}`
            : 'Connected — no active session'}
        </Text>
      )}
      {status.state === 'error' && <Text>Connection error: {status.message}</Text>}
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
})
