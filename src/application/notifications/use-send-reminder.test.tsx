import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ReminderRateLimitedError,
  useSendReminder,
} from '@/application/notifications/use-send-reminder'

const { sendReminderNotificationMock } = vi.hoisted(() => ({
  sendReminderNotificationMock: vi.fn(),
}))

vi.mock('@sadhana-connect/infra-supabase/notification-repository', () => ({
  supabaseNotificationRepository: { sendReminderNotification: sendReminderNotificationMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSendReminder', () => {
  beforeEach(() => {
    sendReminderNotificationMock.mockReset()
  })

  it('sends a generic reminder (null message) straight through', async () => {
    sendReminderNotificationMock.mockResolvedValue({ id: 'n1' })
    const { result } = renderHook(() => useSendReminder(), { wrapper: createWrapper() })

    result.current.mutate({ devoteeId: 'devotee-1', message: null })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sendReminderNotificationMock).toHaveBeenCalledWith('devotee-1', null)
  })

  it('sends a custom message straight through', async () => {
    sendReminderNotificationMock.mockResolvedValue({ id: 'n1' })
    const { result } = renderHook(() => useSendReminder(), { wrapper: createWrapper() })

    result.current.mutate({ devoteeId: 'devotee-1', message: 'Please fill in for Monday.' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sendReminderNotificationMock).toHaveBeenCalledWith('devotee-1', 'Please fill in for Monday.')
  })

  it('translates a RATE_LIMITED repository error into a typed ReminderRateLimitedError', async () => {
    sendReminderNotificationMock.mockRejectedValue(
      new Error('RATE_LIMITED: This devotee has already been reminded twice in the last 24 hours.'),
    )
    const { result } = renderHook(() => useSendReminder(), { wrapper: createWrapper() })

    result.current.mutate({ devoteeId: 'devotee-1', message: null })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ReminderRateLimitedError)
  })

  it('translates a RATE_LIMITED error even when it is a plain object, not an Error instance — this is the actual shape supabase-js\'s .rpc() rejects with live, confirmed via browser E2E (PostgrestError\'s own class declaration extends Error, but the real rejection value fails `instanceof Error`)', async () => {
    sendReminderNotificationMock.mockRejectedValue({
      message: 'RATE_LIMITED: This devotee has already been reminded twice in the last 24 hours.',
      code: 'P0001',
      details: null,
      hint: null,
    })
    const { result } = renderHook(() => useSendReminder(), { wrapper: createWrapper() })

    result.current.mutate({ devoteeId: 'devotee-1', message: null })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ReminderRateLimitedError)
  })

  it('passes through a non-rate-limit error unchanged', async () => {
    sendReminderNotificationMock.mockRejectedValue(new Error('Not authorized to send a reminder to this devotee.'))
    const { result } = renderHook(() => useSendReminder(), { wrapper: createWrapper() })

    result.current.mutate({ devoteeId: 'devotee-1', message: null })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ReminderRateLimitedError)
    expect(result.current.error?.message).toBe('Not authorized to send a reminder to this devotee.')
  })
})
