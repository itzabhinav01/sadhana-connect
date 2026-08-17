import type { AuthEvent } from '@/domain/entities/auth-event'
import type { AuthSession } from '@/domain/entities/auth-session'

export interface SignUpParams {
  email: string
  password: string
  fullName: string
}

export interface SignInParams {
  email: string
  password: string
}

export interface ConfirmEmailParams {
  tokenHash: string
  type: string
}

export interface AuthRepository {
  getSession(): Promise<AuthSession | null>
  onAuthStateChange(
    callback: (event: AuthEvent, session: AuthSession | null) => void,
  ): () => void
  signUp(params: SignUpParams): Promise<{ session: AuthSession | null }>
  signIn(params: SignInParams): Promise<AuthSession>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(newPassword: string): Promise<void>
  confirmEmail(params: ConfirmEmailParams): Promise<AuthSession | null>
}
