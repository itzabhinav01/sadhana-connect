import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { AuthContext } from './auth-context'
import type { AuthSession } from '@sadhana-connect/domain'
import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    void supabaseAuthRepository.getSession().then((initialSession) => {
      if (!isMounted) return
      setSession(initialSession)
      setIsLoading(false)
    })

    const unsubscribe = supabaseAuthRepository.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return
        setSession(nextSession)
        setIsLoading(false)
      },
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
