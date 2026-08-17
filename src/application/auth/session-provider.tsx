import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { AuthContext } from '@/application/auth/auth-context'
import type { AuthSession } from '@/domain/entities/auth-session'
import { supabaseAuthRepository } from '@/infrastructure/supabase/auth-repository'

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
