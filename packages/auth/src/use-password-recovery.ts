import { useEffect, useState } from 'react'

import { supabaseAuthRepository } from '@sadhana-connect/infra-supabase'

// Dedicated listener for the PASSWORD_RECOVERY event, scoped to the
// reset-password page only. A recovery session looks like a normal
// authenticated session once established, so the event itself — not a
// getSession() check — is the only reliable signal that this visit came
// from a password-reset email link.
export function usePasswordRecovery() {
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)

  useEffect(() => {
    const unsubscribe = supabaseAuthRepository.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryReady(true)
      }
    })

    return unsubscribe
  }, [])

  return { isRecoveryReady }
}
