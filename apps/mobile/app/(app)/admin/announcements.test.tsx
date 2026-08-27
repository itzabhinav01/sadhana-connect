jest.mock('../../../../../packages/announcements/src/use-announcements', () => ({
  useAnnouncements: jest.fn(),
}))

jest.mock('../../../../../packages/announcements/src/use-create-admin-announcement', () => ({
  useCreateAdminAnnouncement: jest.fn(),
}))

jest.mock('../../../../../packages/announcements/src/use-update-announcement', () => ({
  useUpdateAnnouncement: jest.fn(),
}))

jest.mock('../../../../../packages/announcements/src/use-delete-announcement', () => ({
  useDeleteAnnouncement: jest.fn(),
}))

jest.mock('../../../../../packages/admin/src/use-admin-temple-groups', () => ({
  useAdminTempleGroups: jest.fn(),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useAdminTempleGroups } from '@sadhana-connect/admin'
import {
  useAnnouncements,
  useCreateAdminAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from '@sadhana-connect/announcements'

import AdminAnnouncementsScreen from './announcements'

const mockUseAnnouncements = useAnnouncements as jest.Mock
const mockUseCreateAdminAnnouncement = useCreateAdminAnnouncement as jest.Mock
const mockUseUpdateAnnouncement = useUpdateAnnouncement as jest.Mock
const mockUseDeleteAnnouncement = useDeleteAnnouncement as jest.Mock
const mockUseAdminTempleGroups = useAdminTempleGroups as jest.Mock
const mockCreateMutate = jest.fn()
const mockUpdateMutate = jest.fn()
const mockDeleteMutate = jest.fn()

const announcementA = {
  id: 'a1',
  authorId: 'mentor-1',
  title: 'Notice A',
  content: 'Body A',
  scope: 'all' as const,
  templeGroupId: null,
  isPublished: true,
  publishedAt: '2026-01-15T00:00:00.000Z',
  expiresAt: null,
  isPinned: false,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

const announcementB = {
  ...announcementA,
  id: 'a2',
  authorId: 'mentor-2',
  title: 'Notice B',
  isPublished: false,
}

describe('AdminAnnouncementsScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAnnouncements.mockReset()
    mockUseCreateAdminAnnouncement.mockReset()
    mockUseUpdateAnnouncement.mockReset()
    mockUseDeleteAnnouncement.mockReset()
    mockUseAdminTempleGroups.mockReset()
    mockCreateMutate.mockReset()
    mockUpdateMutate.mockReset()
    mockDeleteMutate.mockReset()

    mockUseCreateAdminAnnouncement.mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
      isError: false,
    })
    mockUseUpdateAnnouncement.mockReturnValue({ mutate: mockUpdateMutate, isPending: false })
    mockUseDeleteAnnouncement.mockReturnValue({ mutate: mockDeleteMutate, isPending: false })
    mockUseAdminTempleGroups.mockReturnValue({ data: [{ id: 'group-1', name: 'Main Temple' }] })
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
  })

  it('shows the create form, always (a Super Admin never needs a temple group prerequisite)', async () => {
    const { getByRole } = await render(<AdminAnnouncementsScreen />)
    expect(getByRole('button', { name: 'Post Announcement' })).toBeTruthy()
  })

  it('shows a loading state while announcements are pending', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    const { getByText } = await render(<AdminAnnouncementsScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an empty state when there are no announcements', async () => {
    const { getByText } = await render(<AdminAnnouncementsScreen />)
    expect(getByText('No announcements yet.')).toBeTruthy()
  })

  it('rejects an empty title/content without calling the mutation', async () => {
    const { getByRole, getByText } = await render(<AdminAnnouncementsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Post Announcement' }))

    expect(mockCreateMutate).not.toHaveBeenCalled()
    expect(getByText('Title is required.')).toBeTruthy()
  })

  it('requires a temple group to be selected when scope is "Temple group"', async () => {
    const { getByRole, getByLabelText, getByText } = await render(<AdminAnnouncementsScreen />)
    await fireEvent.changeText(getByLabelText('Title'), 'Group Notice')
    await fireEvent.changeText(getByLabelText('Content'), 'Body.')
    await fireEvent.press(getByRole('button', { name: 'Temple group' }))
    await fireEvent.press(getByRole('button', { name: 'Post Announcement' }))

    expect(mockCreateMutate).not.toHaveBeenCalled()
    expect(getByText('Select a temple group for this scope.')).toBeTruthy()
  })

  it('submits with the chosen scope, defaulting to "all", and resets the form on success', async () => {
    mockCreateMutate.mockImplementation((_input, options) => options?.onSuccess?.())

    const { getByRole, getByLabelText } = await render(<AdminAnnouncementsScreen />)
    await fireEvent.changeText(getByLabelText('Title'), 'Temple Closure Notice')
    await fireEvent.changeText(getByLabelText('Content'), 'The temple will be closed Monday.')
    await fireEvent.press(getByRole('button', { name: 'Post Announcement' }))

    expect(mockCreateMutate).toHaveBeenCalledWith(
      {
        title: 'Temple Closure Notice',
        content: 'The temple will be closed Monday.',
        scope: 'all',
        templeGroupId: null,
        isPublished: true,
        expiresAt: null,
      },
      expect.anything(),
    )
  })

  it('submits scope: temple_group with the selected group id', async () => {
    const { getByRole, getByLabelText } = await render(<AdminAnnouncementsScreen />)
    await fireEvent.changeText(getByLabelText('Title'), 'Group Notice')
    await fireEvent.changeText(getByLabelText('Content'), 'Body.')
    await fireEvent.press(getByRole('button', { name: 'Temple group' }))
    await fireEvent.press(getByRole('button', { name: 'Main Temple' }))
    await fireEvent.press(getByRole('button', { name: 'Post Announcement' }))

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'temple_group', templeGroupId: 'group-1' }),
      expect.anything(),
    )
  })

  it('shows Edit/Publish/Pin/Delete on every announcement, regardless of author', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [announcementA, announcementB],
    })

    const { getAllByRole } = await render(<AdminAnnouncementsScreen />)
    expect(getAllByRole('button', { name: 'Edit' })).toHaveLength(2)
    expect(getAllByRole('button', { name: 'Delete' })).toHaveLength(2)
  })

  it('requires delete confirmation before calling the mutation', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [announcementA],
    })

    const { getByRole, getByText } = await render(<AdminAnnouncementsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Delete' }))
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    expect(
      getByText('Deleting removes this announcement for devotees. This cannot be undone.'),
    ).toBeTruthy()

    await fireEvent.press(getByRole('button', { name: 'Confirm delete' }))
    expect(mockDeleteMutate).toHaveBeenCalledWith('a1')
  })

  it('Publish toggles isPublished while leaving every other field unchanged', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [announcementB],
    })

    const { getByRole } = await render(<AdminAnnouncementsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Publish' }))

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: 'a2',
      title: 'Notice B',
      content: 'Body A',
      isPublished: true,
      expiresAt: null,
      isPinned: false,
    })
  })

  it('Pin toggles isPinned while leaving every other field unchanged', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [announcementA],
    })

    const { getByRole } = await render(<AdminAnnouncementsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Pin' }))

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: 'a1',
      title: 'Notice A',
      content: 'Body A',
      isPublished: true,
      expiresAt: null,
      isPinned: true,
    })
  })
})
