import { useMutation } from '@tanstack/react-query'

import { supabaseNotificationRepository } from '@sadhana-connect/infra-supabase'

// Exact required copy — the RPC (public.send_reminder_notification, 0012)
// raises a message prefixed "RATE_LIMITED:" specifically so this hook can
// recognize it and surface a friendly, typed error instead of a generic
// failure message. Matches the same pattern as
// MentorHasActiveDevoteesError (use-change-user-role.ts).
export const REMINDER_RATE_LIMITED_MESSAGE =
  'This devotee has already been reminded twice in the last 24 hours.'

export class ReminderRateLimitedError extends Error {
  constructor() {
    super(REMINDER_RATE_LIMITED_MESSAGE)
    this.name = 'ReminderRateLimitedError'
  }
}

interface SendReminderInput {
  devoteeId: string
  message: string | null
}

// No cache invalidation on success: the resulting notification belongs
// to the DEVOTEE's own inbox, which this caller (mentor/admin) has no
// RLS read access to and therefore no cache entry for in the first
// place — this mutation is fire-and-forget from the sender's side.
// Authorization (own-devotee-only for a mentor, any devotee for a
// super_admin) and the 2-per-24h rate limit are both enforced entirely
// inside the RPC itself; this hook only translates its specific
// rate-limit failure into a typed error the UI can show distinctly from
// a generic error.
export function useSendReminder() {
  return useMutation({
    mutationFn: async ({ devoteeId, message }: SendReminderInput) => {
      try {
        return await supabaseNotificationRepository.sendReminderNotification(devoteeId, message)
      } catch (error) {
        // Deliberately NOT `error instanceof Error` — a PostgREST RPC
        // error surfaces here as a plain object (verified live: it has
        // `.message`/`.code` but fails an `instanceof Error` check, even
        // though PostgrestError's own class declaration extends Error),
        // not an Error instance. Checking for a string `.message` field
        // directly matches what the client actually returns.
        const message = (error as { message?: unknown } | null)?.message
        if (typeof message === 'string' && message.includes('RATE_LIMITED')) {
          throw new ReminderRateLimitedError()
        }
        throw error
      }
    },
  })
}
