import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUpdatePhoneNumber } from '@/application/profile/use-update-phone-number'
import { profileQueryKeys } from '@sadhana-connect/auth'

const { useAuthMock, updatePhoneNumberMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  updatePhoneNumberMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/auth')>()
  return {
    ...actual,
    useAuth: useAuthMock,
  }
})

vi.mock('@sadhana-connect/infra-supabase/profile-repository', () => ({
  supabaseProfileRepository: { updatePhoneNumber: updatePhoneNumberMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, invalidateQueries }
}

describe('useUpdatePhoneNumber', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    updatePhoneNumberMock.mockReset()
  })

  it('updates the phone number for the authenticated user and invalidates their profile query', async () => {
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    updatePhoneNumberMock.mockResolvedValue({
      id: 'user-1',
      fullName: 'User One',
      role: 'devotee',
      templeGroupId: null,
      isActive: true,
      phoneNumber: '+919876543210',
    })

    const { Wrapper, invalidateQueries } = createWrapper()
    const { result } = renderHook(() => useUpdatePhoneNumber(), {
      wrapper: Wrapper,
    })

    result.current.mutate('+919876543210')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updatePhoneNumberMock).toHaveBeenCalledWith(
      'user-1',
      '+919876543210',
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: profileQueryKeys.detail('user-1'),
    })
  })

  it('throws without calling the repository when there is no authenticated user', async () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdatePhoneNumber(), {
      wrapper: Wrapper,
    })

    result.current.mutate('+919876543210')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(updatePhoneNumberMock).not.toHaveBeenCalled()
  })
})
