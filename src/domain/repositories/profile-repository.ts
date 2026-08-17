import type { Profile } from '@/domain/entities/profile'

export interface ProfileRepository {
  // Returns null if no profile row exists for this user id. Every
  // auth.users row gets one via the handle_new_user() trigger, so this is
  // a defensive case (e.g. a query racing that trigger), not an expected
  // steady-state outcome.
  getProfile(userId: string): Promise<Profile | null>
}
