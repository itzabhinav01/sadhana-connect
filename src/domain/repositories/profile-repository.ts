import type { Profile } from '@/domain/entities/profile'

export interface ProfileRepository {
  // Returns null if no profile row exists for this user id. Every
  // auth.users row gets one via the handle_new_user() trigger, so this is
  // a defensive case (e.g. a query racing that trigger), not an expected
  // steady-state outcome.
  getProfile(userId: string): Promise<Profile | null>

  // Own-row only in practice (RLS: profiles_update), for the one column
  // this phase actually needs editable post-registration — phone_number.
  // Not a general profile-editor; full profile editing remains the
  // still-unbuilt future phase ProfilePage's own comment already noted.
  updatePhoneNumber(userId: string, phoneNumber: string): Promise<Profile>
}
