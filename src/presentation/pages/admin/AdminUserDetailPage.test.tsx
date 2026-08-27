import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdminUser } from '@sadhana-connect/domain'
import { AdminUserDetailPage } from '@/presentation/pages/admin/AdminUserDetailPage'

const {
  useAdminUserDetailMock,
  useAdminAssignmentsMock,
  useDeactivateAssignmentMock,
  useMentorDevoteeCountMock,
  useRevealUserEmailMock,
  useSetUserActiveMock,
  useHardDeleteUserMock,
  useGenerateRecoveryLinkMock,
  useChangeUserRoleMock,
  useDevoteeReportHistoryMock,
  useSendReminderMock,
} = vi.hoisted(() => ({
  useAdminUserDetailMock: vi.fn(),
  useAdminAssignmentsMock: vi.fn(),
  useDeactivateAssignmentMock: vi.fn(),
  useMentorDevoteeCountMock: vi.fn(),
  useRevealUserEmailMock: vi.fn(),
  useSetUserActiveMock: vi.fn(),
  useHardDeleteUserMock: vi.fn(),
  useGenerateRecoveryLinkMock: vi.fn(),
  useChangeUserRoleMock: vi.fn(),
  useDevoteeReportHistoryMock: vi.fn(),
  useSendReminderMock: vi.fn(),
}))

vi.mock('@sadhana-connect/admin', async () => {
  const actual = await vi.importActual<
    typeof import('@sadhana-connect/admin')
  >('@sadhana-connect/admin')
  return {
    ...actual,
    useAdminUserDetail: useAdminUserDetailMock,
    useAdminAssignments: useAdminAssignmentsMock,
    useDeactivateAssignment: useDeactivateAssignmentMock,
    useMentorDevoteeCount: useMentorDevoteeCountMock,
    useSetUserActive: useSetUserActiveMock,
    useChangeUserRole: useChangeUserRoleMock,
  }
})
vi.mock('@/application/admin/use-admin-user-email', () => ({
  useRevealUserEmail: useRevealUserEmailMock,
}))
vi.mock('@/application/admin/use-hard-delete-user', () => ({
  useHardDeleteUser: useHardDeleteUserMock,
}))
vi.mock('@/application/admin/use-generate-recovery-link', () => ({
  useGenerateRecoveryLink: useGenerateRecoveryLinkMock,
}))
vi.mock('@sadhana-connect/sadhana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/sadhana')>()
  return {
    ...actual,
    useDevoteeReportHistory: useDevoteeReportHistoryMock,
  }
})
vi.mock('@sadhana-connect/notifications', async () => {
  const actual = await vi.importActual<
    typeof import('@sadhana-connect/notifications')
  >('@sadhana-connect/notifications')
  return { ...actual, useSendReminder: useSendReminderMock }
})

const activeUser: AdminUser = {
  id: 'user-1',
  fullName: 'Active Devotee',
  role: 'devotee',
  isActive: true,
  templeGroupId: null,
  phoneNumber: '+919876543210',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/users/user-1']}>
      <Routes>
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminUserDetailPage', () => {
  beforeEach(() => {
    useAdminAssignmentsMock.mockReturnValue({ isPending: false, data: [] })
    useDeactivateAssignmentMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useMentorDevoteeCountMock.mockReturnValue({ isPending: false, data: 0 })
    useRevealUserEmailMock.mockReturnValue({ data: undefined, isPending: false, isError: false, mutate: vi.fn() })
    useSetUserActiveMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
    useHardDeleteUserMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
    useGenerateRecoveryLinkMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, reset: vi.fn() })
    useChangeUserRoleMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
    useDevoteeReportHistoryMock.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })
    useSendReminderMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })
  })

  it('renders the role control for a devotee (no more "anonymized" state to guard against)', () => {
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: activeUser })

    renderPage()

    expect(screen.getByLabelText('Change role')).toBeInTheDocument()
  })

  it('shows the phone number when present, or "Not provided" when absent', () => {
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: activeUser })

    renderPage()

    expect(screen.getByText('+919876543210')).toBeInTheDocument()
  })

  it('shows "Not provided" when the user has no phone number on file', () => {
    useAdminUserDetailMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeUser, phoneNumber: null },
    })

    renderPage()

    expect(screen.getByText('Not provided')).toBeInTheDocument()
  })

  it('shows "No mentor assigned" for a devotee with zero active mentors', () => {
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: activeUser })
    useAdminAssignmentsMock.mockReturnValue({ isPending: false, data: [] })

    renderPage()

    expect(screen.getByText('No mentor assigned')).toBeInTheDocument()
  })

  it('lists every active mentor for a devotee with more than one (up to the approved cap of 3)', () => {
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: activeUser })
    useAdminAssignmentsMock.mockReturnValue({
      isPending: false,
      data: [
        {
          id: 'assignment-1',
          mentorId: 'mentor-1',
          mentorName: 'Mentor One',
          devoteeId: 'user-1',
          devoteeName: 'Active Devotee',
          isActive: true,
          assignedAt: '2026-01-01T00:00:00.000Z',
          unassignedAt: null,
        },
        {
          id: 'assignment-2',
          mentorId: 'mentor-2',
          mentorName: 'Mentor Two',
          devoteeId: 'user-1',
          devoteeName: 'Active Devotee',
          isActive: true,
          assignedAt: '2026-01-02T00:00:00.000Z',
          unassignedAt: null,
        },
        {
          id: 'assignment-3',
          mentorId: 'mentor-3',
          mentorName: 'Mentor Three',
          devoteeId: 'user-1',
          devoteeName: 'Active Devotee',
          isActive: false,
          assignedAt: '2025-12-01T00:00:00.000Z',
          unassignedAt: '2025-12-15T00:00:00.000Z',
        },
      ],
    })

    renderPage()

    expect(screen.getByText('Mentor One')).toBeInTheDocument()
    expect(screen.getByText('Mentor Two')).toBeInTheDocument()
    // Inactive history is not part of this compact "current mentors"
    // panel — the full history remains on the dedicated Assignments page.
    expect(screen.queryByText('Mentor Three')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(2)
  })

  it('deactivates the specific assignment when its Remove button is clicked', async () => {
    const mutate = vi.fn()
    useDeactivateAssignmentMock.mockReturnValue({ mutate, isPending: false })
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: activeUser })
    useAdminAssignmentsMock.mockReturnValue({
      isPending: false,
      data: [
        {
          id: 'assignment-1',
          mentorId: 'mentor-1',
          mentorName: 'Mentor One',
          devoteeId: 'user-1',
          devoteeName: 'Active Devotee',
          isActive: true,
          assignedAt: '2026-01-01T00:00:00.000Z',
          unassignedAt: null,
        },
      ],
    })
    const user = userEvent.setup()

    renderPage()
    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(mutate).toHaveBeenCalledWith('assignment-1')
  })

  it('requires typed confirmation before hard-deleting, and warns the action is irreversible', async () => {
    const mutate = vi.fn()
    useHardDeleteUserMock.mockReturnValue({ mutate, isPending: false, isError: false })
    useAdminUserDetailMock.mockReturnValue({ isPending: false, isError: false, data: activeUser })
    const user = userEvent.setup()

    renderPage()
    await user.click(screen.getByRole('button', { name: 'Delete account' }))

    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()

    const confirmInput = screen.getByLabelText(/Active Devotee/)
    await user.type(confirmInput, 'Active Devotee')
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(mutate).toHaveBeenCalledWith('user-1', expect.anything())
  })
})
