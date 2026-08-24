import type { EmailOtpType, Session } from '@supabase/supabase-js'

import type { AuthEvent } from '@sadhana-connect/domain/entities/auth-event'
import type { AuthSession } from '@sadhana-connect/domain/entities/auth-session'
import type {
  AuthRepository,
  ConfirmEmailParams,
  SignInParams,
  SignUpParams,
} from '@sadhana-connect/domain/repositories/auth-repository'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase/client'

function mapSession(session: Session | null): AuthSession | null {
  if (!session) return null

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    emailConfirmedAt: session.user.email_confirmed_at ?? null,
  }
}

export const supabaseAuthRepository: AuthRepository = {
  async getSession() {
    const { data } = await getSupabaseClient().auth.getSession()
    return mapSession(data.session)
  },

  onAuthStateChange(callback) {
    const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
      callback(event as AuthEvent, mapSession(session))
    })

    return () => data.subscription.unsubscribe()
  },

  async signUp({ email, password, fullName, phoneNumber }: SignUpParams) {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone_number: phoneNumber },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) throw error

    return { session: mapSession(data.session) }
  },

  async signIn({ email, password }: SignInParams) {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    const session = mapSession(data.session)
    if (!session) throw new Error('Sign in did not return a session.')

    return session
  },

  async signOut() {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) throw error
  },

  async requestPasswordReset(email: string) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await getSupabaseClient().auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },

  async confirmEmail({ tokenHash, type }: ConfirmEmailParams) {
    const { data, error } = await getSupabaseClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    if (error) throw error

    return mapSession(data.session)
  },
}
