import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdminUser } from '@/domain/entities/admin-user'
import { AdminUserDetailPage } from '@/presentation/pages/admin/AdminUserDetailPage'

const {
  useAdminUserDetailMock,
  useAdminAssignmentsMock,
  useMentorDevoteeCountMock,
  useRevealUserEmailMock,
  useSetUserActiveMock,
  useDeleteAndAnonymizeUserMock,
  useRetryBanMock,
  useGenerateRecoveryLinkMock,
  useChangeUserRoleMock,
} = vi.hoisted(() => ({
  useAdminUserDetailMock: vi.fn(),
  useAdminAssignmentsMock: vi.fn(),
  useMentorDevoteeCountMock: vi.fn(),
  useRevealUserEmailMock: vi.fn(),
  useSetUserActiveMock: vi.fn(),
  useDeleteAndAnonymizeUserMock: vi.fn(),
  useRetryBanMock: vi.fn(),
  useGenerateRecoveryLinkMock: vi.fn(),
  useChangeUserRoleMock: vi.fn(),
}))

vi.mock('@/application/admin/use-admin-user-detail', () => ({
  useAdminUserDetail: useAdminUserDetailMock,
}))
vi.mock('@/application/admin/use-admin-assignments', () => ({
  useAdminAssignments: useAdminAssignmentsMock,
}))
vi.mock('@/application/admin/use-mentor-devotee-count', () => ({
  useMentorDevoteeCount: useMentorDevoteeCountMock,
}))
vi.mock('@/application/admin/use-admin-user-email', () => ({
  useRevealUserEmail: useRevealUserEmailMock,
}))
vi.mock('@/application/admin/use-set-user-active', () => ({
  useSetUserActive: useSetUserActiveMock,
}))
vi.mock('@/application/admin/use-delete-and-anonymize-user', () => ({
  useDeleteAndAnonymizeUser: useDeleteAndAnonymizeUserMock,
  useRetryBan: useRetryBanMock,
}))
vi.mock('@/application/admin/use-generate-recovery-link', () => ({
  useGenerateRecoveryLink: useGenerateRecoveryLinkMock,
}))
vi.mock('@/application/admin/use-change-user-role', async () => {
  const actual = await vi.importActual<
    typeof import('@/application/admin/use-change-user-role')
  >('@/application/admin/use-change-user-role')
  return { ...actual, useChangeUserRole: useChangeUserRoleMock }
})

const anonymizedUser: AdminUser = {
  id: 'user-1',
  fullName: 'Deleted User',
  role: 'devotee',
  isActive: false,
  anonymizedAt: '2026-01-01T00:00:00.000Z',
  templeGroupId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const activeUser: AdminUser = { ...anonymizedUser, fullName: 'Active Devotee', isActive: true, anonymizedAt: null }

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/users/user-1']}>
      <Routes>
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminUserDetailPage — role control visibility', () => {
  beforeEach(() => {
    useAdminAssignmentsMock.mockReturnValue({ isPending: false, data: [] })
    useMentorDevoteeCountMock.mockReturnValue({ isPending: false, data: 0 })
    useRevealUserEmailMock.mockReturnValue({ data: undefined, isPending: false, isError: false, mutate: vi.fn() })
    useSetUserActiveMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useDeleteAndAnonymizeUserMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useRetryBanMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })
    useGenerateRecoveryLinkMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, reset: vi.fn() })
    useChangeUserRoleMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  })

  it('does not render the role control for an anonymized/deleted user, and shows Deleted status instead', () => {
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: anonymizedUser })

    renderPage()

    expect(screen.getByText('Deleted')).toBeInTheDocument()
    expect(screen.queryByLabelText('Change role')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save role/i })).not.toBeInTheDocument()
  })

  it('renders the role control for a non-anonymized devotee', () => {
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: activeUser })

    renderPage()

    expect(screen.getByLabelText('Change role')).toBeInTheDocument()
  })
})
