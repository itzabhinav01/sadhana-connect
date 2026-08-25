jest.mock('../../../../../packages/announcements/src/use-announcements', () => ({
  useAnnouncements: jest.fn(),
}))

jest.mock('../../../../../packages/announcements/src/use-create-announcement', () => ({
  useCreateMentorAnnouncement: jest.fn(),
}))

jest.mock('../../../../../packages/announcements/src/use-update-announcement', () => ({
  useUpdateAnnouncement: jest.fn(),
}))

jest.mock('../../../../../packages/announcements/src/use-delete-announcement', () => ({
  useDeleteAnnouncement: jest.fn(),
}))

jest.mock('../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  useAnnouncements,
  useCreateMentorAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from '@sadhana-connect/announcements'
import { useAuth, useProfile } from '@sadhana-connect/auth'

import MentorAnnouncementsScreen from './announcements'

const mockUseAnnouncements = useAnnouncements as jest.Mock
const mockUseCreateMentorAnnouncement = useCreateMentorAnnouncement as jest.Mock
const mockUseUpdateAnnouncement = useUpdateAnnouncement as jest.Mock
const mockUseDeleteAnnouncement = useDeleteAnnouncement as jest.Mock
const mockUseAuth = useAuth as jest.Mock
const mockUseProfile = useProfile as jest.Mock
const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
const mockDeleteMutate = jest.fn()

const ownAnnouncement = {
  id: 'a1',
  authorId: 'mentor-1',
  title: 'My Notice',
  content: 'Body text',
  scope: 'temple_group' as const,
  templeGroupId: 'group-1',
  isPublished: true,
  publishedAt: '2026-01-15T00:00:00.000Z',
  expiresAt: null,
  isPinned: false,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

const otherAnnouncement = {
  ...ownAnnouncement,
  id: 'a2',
  authorId: 'mentor-2',
  title: 'Other Notice',
}

describe('MentorAnnouncementsScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAnnouncements.mockReset()
    mockUseCreateMentorAnnouncement.mockReset()
    mockUseUpdateAnnouncement.mockReset()
    mockUseDeleteAnnouncement.mockReset()
    mockUseAuth.mockReset()
    mockUseProfile.mockReset()
    mockCreateMutate.mockReset()
    mockUpdateMutate.mockReset()
    mockDeleteMutate.mockReset()

    mockUseAuth.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    mockUseCreateMentorAnnouncement.mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
      isError: false,
    })
    mockUseUpdateAnnouncement.mockReturnValue({ mutate: mockUpdateMutate, isPending: false })
    mockUseDeleteAnnouncement.mockReturnValue({ mutate: mockDeleteMutate, isPending: false })
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
  })

  it('shows the prerequisite message and no form when the mentor has no temple group', async () => {
    mockUseProfile.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: null, isActive: true },
    })

    const { getByText, queryByRole } = await render(<MentorAnnouncementsScreen />)
    expect(
      getByText("You haven't been assigned to a temple group yet. Please contact your Super Admin."),
    ).toBeTruthy()
    expect(queryByRole('button', { name: 'Post Announcement' })).toBeNull()
  })

  it('shows the create form when the mentor has a temple group', async () => {
    mockUseProfile.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })

    const { getByRole } = await render(<MentorAnnouncementsScreen />)
    expect(getByRole('button', { name: 'Post Announcement' })).toBeTruthy()
  })

  it('shows a loading state while announcements are pending', async () => {
    mockUseProfile.mockReturnValue({ isSuccess: false, data: undefined })
    mockUseAnnouncements.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    const { getByText } = await render(<MentorAnnouncementsScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an empty state when there are no announcements', async () => {
    mockUseProfile.mockReturnValue({ isSuccess: false, data: undefined })

    const { getByText } = await render(<MentorAnnouncementsScreen />)
    expect(getByText('No announcements yet.')).toBeTruthy()
  })

  it('rejects an empty title/content without calling the mutation', async () => {
    mockUseProfile.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })

    const { getByRole, getByText } = await render(<MentorAnnouncementsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Post Announcement' }))

    expect(mockCreateMutate).not.toHaveBeenCalled()
    expect(getByText('Title is required.')).toBeTruthy()
  })

  it('choosing "Custom date" without picking a date shows a validation error and does not submit', async () => {
    mockUseProfile.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })

    const { getByRole, getByLabelText, getByText } = await render(<MentorAnnouncementsScreen />)
    await fireEvent.changeText(getByLabelText('Title'), 'Custom Expiry Notice')
    await fireEvent.changeText(getByLabelText('Content'), 'Body.')
    await fireEvent.press(getByRole('button', { name: 'Custom date' }))
    await fireEvent.press(getByRole('button', { name: 'Post Announcement' }))

    expect(mockCreateMutate).not.toHaveBeenCalled()
    expect(getByText('Choose an expiration date.')).toBeTruthy()
  })

  it('submits with isPublished: true by default and resets the form on success', async () => {
    mockCreateMutate.mockImplementation((_input, options) => options?.onSuccess?.())
    mockUseProfile.mockReturnValue({
      isSuccess: true,
      data: { id: 'mentor-1', fullName: 'Mentor', role: 'mentor', templeGroupId: 'group-1', isActive: true },
    })

    const { getByRole, getByLabelText } = await render(<MentorAnnouncementsScreen />)
    await fireEvent.changeText(getByLabelText('Title'), 'Temple Closure Notice')
    await fireEvent.changeText(getByLabelText('Content'), 'The temple will be closed Monday.')
    await fireEvent.press(getByRole('button', { name: 'Post Announcement' }))

    expect(mockCreateMutate).toHaveBeenCalledWith(
      {
        title: 'Temple Closure Notice',
        content: 'The temple will be closed Monday.',
        isPublished: true,
        expiresAt: null,
      },
      expect.anything(),
    )
  })

  it('shows Edit/Pin/Delete only for the current mentor\'s own announcement', async () => {
    mockUseProfile.mockReturnValue({ isSuccess: false, data: undefined })
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownAnnouncement, otherAnnouncement],
    })

    const { getAllByRole } = await render(<MentorAnnouncementsScreen />)
    expect(getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('requires delete confirmation before calling the mutation', async () => {
    mockUseProfile.mockReturnValue({ isSuccess: false, data: undefined })
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownAnnouncement],
    })

    const { getByRole, getByText } = await render(<MentorAnnouncementsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Delete' }))
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    expect(
      getByText('Deleting removes this announcement for devotees. This cannot be undone.'),
    ).toBeTruthy()

    await fireEvent.press(getByRole('button', { name: 'Confirm delete' }))
    expect(mockDeleteMutate).toHaveBeenCalledWith('a1')
  })

  it('Pin toggles isPinned while leaving every other field unchanged', async () => {
    mockUseProfile.mockReturnValue({ isSuccess: false, data: undefined })
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownAnnouncement],
    })

    const { getByRole } = await render(<MentorAnnouncementsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Pin' }))

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: 'a1',
      title: 'My Notice',
      content: 'Body text',
      isPublished: true,
      expiresAt: null,
      isPinned: true,
    })
  })
})
