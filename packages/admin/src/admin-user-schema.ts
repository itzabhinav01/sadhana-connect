import { z } from 'zod'

// devotee <-> mentor only — super_admin is never a selectable value in the
// normal admin UI. The database (protect_profile_restricted_columns +
// profiles_update RLS) is the real boundary regardless; this schema exists
// so the UI can never even construct a request containing 'super_admin'.
export const changeRoleSchema = z.object({
  role: z.enum(['devotee', 'mentor']),
})

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>

// Mirrors temple_groups_name_not_blank exactly (0001_initial_schema) — no
// client-only maximum imposed because the database imposes none.
export const templeGroupNameSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
})

export type TempleGroupNameInput = z.infer<typeof templeGroupNameSchema>

export const DELETE_CONFIRMATION_INSTRUCTIONS =
  'Type the account’s exact current full name to confirm.'
