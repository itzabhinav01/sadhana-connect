import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useSignOut } from '@/application/auth/use-sign-out'
import { announcementQueryKeys } from '@/application/announcements/announcement-query-keys'
import { commentQueryKeys } from '@/application/comments/comment-query-keys'
import { mentorQueryKeys } from '@sadhana-connect/mentor'
import { notificationQueryKeys } from '@/application/notifications/notification-query-keys'
import { profileQueryKeys } from '@sadhana-connect/auth'
import { sadhanaQueryKeys } from '@sadhana-connect/sadhana'

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }))

vi.mock('@sadhana-connect/infra-supabase/auth-repository', () => ({
  supabaseAuthRepository: { signOut: signOutMock },
}))

describe('useSignOut', () => {
  it('removes any cached profile queries on successful sign-out', async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    queryClient.setQueryData(profileQueryKeys.detail('user-1'), {
      id: 'user-1',
      fullName: 'Test',
      role: 'devotee',
      templeGroupId: null,
      isActive: true,
    })

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(
      queryClient.getQueryData(profileQueryKeys.detail('user-1')),
    ).toBeUndefined()
  })

  it('removes any cached sadhana report queries on successful sign-out', async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    queryClient.setQueryData(
      sadhanaQueryKeys.detail('user-1', '2026-01-15'),
      { id: 'report-1', signatureText: 'Test Devotee' },
    )

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(
      queryClient.getQueryData(
        sadhanaQueryKeys.detail('user-1', '2026-01-15'),
      ),
    ).toBeUndefined()
  })

  it('removes cached weekly-range and recent-reports (dashboard) queries on sign-out', async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    const rangeKey = sadhanaQueryKeys.range('user-1', '2026-01-09', '2026-01-15')
    const recentKey = sadhanaQueryKeys.recent('user-1', 60)
    queryClient.setQueryData(rangeKey, [{ reportDate: '2026-01-15' }])
    queryClient.setQueryData(recentKey, [{ reportDate: '2026-01-15' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(rangeKey)).toBeUndefined()
    expect(queryClient.getQueryData(recentKey)).toBeUndefined()
  })

  it('removes cached history queries on sign-out', async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    const historyKey = sadhanaQueryKeys.history('user-1', undefined, '2026-01-15')
    queryClient.setQueryData(historyKey, {
      pages: [{ reports: [{ reportDate: '2026-01-15' }] }],
    })

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(historyKey)).toBeUndefined()
  })

  it("removes cached mentor devotee/detail queries on sign-out, so a mentor's data never survives into a different account's session", async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    const devoteesKey = mentorQueryKeys.devotees('mentor-1')
    const detailKey = mentorQueryKeys.devoteeProfile('mentor-1', 'devotee-1')
    queryClient.setQueryData(devoteesKey, [{ devoteeId: 'devotee-1' }])
    queryClient.setQueryData(detailKey, { id: 'devotee-1', fullName: 'D' })

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(devoteesKey)).toBeUndefined()
    expect(queryClient.getQueryData(detailKey)).toBeUndefined()
  })

  it("removes cached comment queries on sign-out, so a mentor's comment threads never survive into a different account's session", async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    const commentsKey = commentQueryKeys.list('mentor-1', 'report-1')
    queryClient.setQueryData(commentsKey, [{ id: 'c1' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(commentsKey)).toBeUndefined()
  })

  it('removes cached announcement queries on sign-out', async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    const announcementsKey = announcementQueryKeys.list('mentor-1')
    queryClient.setQueryData(announcementsKey, [{ id: 'a1' }])

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(announcementsKey)).toBeUndefined()
  })

  it("removes cached notification queries on sign-out, so a devotee's notifications never survive into a different account's session", async () => {
    signOutMock.mockResolvedValue(undefined)

    const queryClient = new QueryClient()
    const listKey = notificationQueryKeys.list('user-1')
    const unreadCountKey = notificationQueryKeys.unreadCount('user-1')
    queryClient.setQueryData(listKey, { notifications: [{ id: 'n1' }], nextCursor: null })
    queryClient.setQueryData(unreadCountKey, 3)

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(listKey)).toBeUndefined()
    expect(queryClient.getQueryData(unreadCountKey)).toBeUndefined()
  })
})
