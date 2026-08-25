import { createContext } from 'react'

import type { AuthSession } from '@sadhana-connect/domain'

export interface AuthContextValue {
  session: AuthSession | null
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
