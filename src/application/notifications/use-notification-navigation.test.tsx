import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotificationNavigation } from '@/application/notifications/use-notification-navigation'
import type { SadhanaNotification } from '@/domain/entities/notification'

const { navigateMock, getReportDateByIdMock, useAuthMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getReportDateByIdMock: vi.fn(),
  useAuthMock: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/infrastructure/supabase/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: { getReportDateById: getReportDateByIdMock },
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

function baseNotification(
  overrides: Partial<SadhanaNotification> = {},
): SadhanaNotification {
  return {
    id: 'n1',
    recipientId: 'user-1',
    type: 'mentor_comment',
    title: 'New mentor comment',
    body: 'Keep it up!',
    relatedAnnouncementId: null,
    relatedReportId: null,
    isRead: false,
    readAt: null,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  }
}

function renderNavigationHook() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return renderHook(() => useNotificationNavigation(), { wrapper })
}

describe('useNotificationNavigation', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    getReportDateByIdMock.mockReset()
    useAuthMock.mockReset()
    useAuthMock.mockReturnValue({
      session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('resolves the report date and navigates to /sadhana?date=... for a mentor_comment notification', async () => {
    getReportDateByIdMock.mockResolvedValue('2026-01-10')
    const { result } = renderNavigationHook()

    await result.current(
      baseNotification({ type: 'mentor_comment', relatedReportId: 'report-1' }),
    )

    expect(getReportDateByIdMock).toHaveBeenCalledWith('report-1')
    expect(navigateMock).toHaveBeenCalledWith('/sadhana?date=2026-01-10')
  })

  it('scopes the report-date cache lookup by the current userId', async () => {
    getReportDateByIdMock.mockResolvedValue('2026-01-10')
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const fetchQuerySpy = vi.spyOn(queryClient, 'fetchQuery')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => useNotificationNavigation(), { wrapper })

    await result.current(
      baseNotification({ type: 'mentor_comment', relatedReportId: 'report-1' }),
    )

    expect(fetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['sadhana-report', 'date-by-id', 'user-1', 'report-1'],
      }),
    )
  })

  it('navigates to /announcements/:id for an announcement notification', async () => {
    const { result } = renderNavigationHook()

    await result.current(
      baseNotification({
        type: 'announcement',
        relatedReportId: null,
        relatedAnnouncementId: 'announcement-1',
      }),
    )

    expect(navigateMock).toHaveBeenCalledWith('/announcements/announcement-1')
    expect(getReportDateByIdMock).not.toHaveBeenCalled()
  })

  it('falls back to /notifications when a mentor_comment report no longer resolves', async () => {
    getReportDateByIdMock.mockResolvedValue(null)
    const { result } = renderNavigationHook()

    await result.current(
      baseNotification({ type: 'mentor_comment', relatedReportId: 'deleted-report' }),
    )

    expect(navigateMock).toHaveBeenCalledWith('/notifications')
  })

  it('navigates to /sadhana for a sadhana_reminder notification (no single related row to deep-link to)', async () => {
    const { result } = renderNavigationHook()

    await result.current(
      baseNotification({
        type: 'sadhana_reminder',
        relatedReportId: null,
        relatedAnnouncementId: null,
      }),
    )

    expect(navigateMock).toHaveBeenCalledWith('/sadhana')
    expect(getReportDateByIdMock).not.toHaveBeenCalled()
  })

  it('falls back to /notifications for a notification with no related id', async () => {
    const { result } = renderNavigationHook()

    await result.current(
      baseNotification({
        type: 'system',
        relatedReportId: null,
        relatedAnnouncementId: null,
      }),
    )

    expect(navigateMock).toHaveBeenCalledWith('/notifications')
  })
})
