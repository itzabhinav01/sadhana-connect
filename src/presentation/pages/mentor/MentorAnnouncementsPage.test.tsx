import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MentorAnnouncementsPage } from '@/presentation/pages/mentor/MentorAnnouncementsPage'

const { useProfileMock, useAnnouncementsMock } = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useAnnouncementsMock: vi.fn(),
}))

vi.mock('@/application/profile/use-profile', () => ({
  useProfile: useProfileMock,
}))
vi.mock('@/application/announcements/use-announcements', () => ({
  useAnnouncements: useAnnouncementsMock,
}))
// The form/list pull in react-hook-form + mutation hooks; stub them out
// so this page-level test only exercises the page's own branching.
vi.mock('@/application/announcements/use-create-announcement', () => ({
  useCreateMentorAnnouncement: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))
vi.mock('@/application/announcements/use-update-announcement', () => ({
  useUpdateAnnouncement: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/application/announcements/use-delete-announcement', () => ({
  useDeleteAnnouncement: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/application/auth/use-auth', () => ({
  useAuth: () => ({ session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null }, isLoading: false }),
}))

describe('MentorAnnouncementsPage', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useAnnouncementsMock.mockReset()
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
  })

  it('shows the prerequisite message and no form when the mentor has no temple group', () => {
    useProfileMock.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: null, isActive: true },
    })

    render(<MentorAnnouncementsPage />)

    expect(
      screen.getByText("You haven't been assigned to a temple group yet. Please contact your Super Admin."),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /post announcement/i })).not.toBeInTheDocument()
  })

  it('shows the create form when the mentor has a temple group', () => {
    useProfileMock.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })

    render(<MentorAnnouncementsPage />)

    expect(screen.getByRole('button', { name: /post announcement/i })).toBeInTheDocument()
    expect(
      screen.queryByText("You haven't been assigned to a temple group yet. Please contact your Super Admin."),
    ).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no visible announcements', () => {
    useProfileMock.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })

    render(<MentorAnnouncementsPage />)

    expect(screen.getByText('No announcements yet.')).toBeInTheDocument()
  })

  it('shows a loading state while announcements are pending', () => {
    useProfileMock.mockReturnValue({ isSuccess: false, data: undefined })
    useAnnouncementsMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    render(<MentorAnnouncementsPage />)

    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })
})
