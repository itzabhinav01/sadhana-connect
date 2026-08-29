import type { Profile } from '../entities/profile'

export interface ProfileRepository {
  // Returns null if no profile row exists for this user id. Every
  // auth.users row gets one via the handle_new_user() trigger, so this is
  // a defensive case (e.g. a query racing that trigger), not an expected
  // steady-state outcome.
  getProfile(userId: string): Promise<Profile | null>

  updatePhoneNumber(userId: string, phoneNumber: string): Promise<Profile>

  updateProfile(
    userId: string,
    updates: { fullName?: string; phoneNumber?: string | null },
  ): Promise<Profile>
}
