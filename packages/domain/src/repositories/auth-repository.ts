import type { AuthEvent } from '../entities/auth-event'
import type { AuthSession } from '../entities/auth-session'

export interface SignUpParams {
  email: string
  password: string
  fullName: string
  // E.164-formatted ('+' + country code + number) — compulsory at
  // registration (approved). Passed through as signup metadata; the
  // profiles.phone_number column stays nullable at the database level
  // (see 0014's own note), so this is enforced by the registration
  // form's Zod schema, not by the DB rejecting a missing value here.
  phoneNumber: string
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
