export interface AuthSession {
  userId: string
  email: string | null
  emailConfirmedAt: string | null
}
