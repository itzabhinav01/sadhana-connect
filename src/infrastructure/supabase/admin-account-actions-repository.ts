import type {
  AdminAccountActionsRepository,
  HardDeleteResult,
  HardDeleteStage,
} from '@/domain/repositories/admin-account-actions-repository'
import { supabase } from '@/infrastructure/supabase/client'

type AdminAccountAction =
  | 'ban'
  | 'unban'
  | 'generate_recovery_link'
  | 'get_user_email'
  | 'hard_delete'

interface AdminAccountActionResponse {
  ok: boolean
  error?: string
  actionLink?: string
  email?: string
  stage?: string
}

// supabase.functions.invoke() automatically attaches the current session's
// access token as the Authorization header — the Edge Function validates
// it via auth.getUser() and re-derives authorization from the caller's own
// profiles row under existing RLS. No token handling here.
async function invoke(
  action: AdminAccountAction,
  targetUserId: string,
): Promise<AdminAccountActionResponse> {
  const { data, error } = await supabase.functions.invoke<AdminAccountActionResponse>(
    'admin-account-actions',
    { body: { action, targetUserId } },
  )

  if (error) throw error
  if (!data?.ok) {
    throw new Error(data?.error ?? 'The requested action could not be completed.')
  }

  return data
}

export const supabaseAdminAccountActionsRepository: AdminAccountActionsRepository = {
  async banUser(targetUserId) {
    await invoke('ban', targetUserId)
  },

  async unbanUser(targetUserId) {
    await invoke('unban', targetUserId)
  },

  async generateRecoveryLink(targetUserId) {
    const result = await invoke('generate_recovery_link', targetUserId)
    if (!result.actionLink) {
      throw new Error('No recovery link was returned.')
    }
    return result.actionLink
  },

  async getUserEmail(targetUserId) {
    const result = await invoke('get_user_email', targetUserId)
    if (!result.email) {
      throw new Error('No email was returned.')
    }
    return result.email
  },

  async hardDeleteUser(targetUserId): Promise<HardDeleteResult> {
    const result = await invoke('hard_delete', targetUserId)
    const stage: HardDeleteStage = result.stage === 'profile-deleted' ? 'profile-deleted' : 'complete'
    return { stage }
  },
}
