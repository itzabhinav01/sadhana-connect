jest.mock('../../../../../../packages/announcements/src/use-announcements', () => ({
  useAnnouncements: jest.fn(),
}))

jest.mock('../../../../../../packages/announcements/src/use-announcement-comments', () => ({
  useAnnouncementComments: jest.fn(),
}))

jest.mock('../../../../../../packages/announcements/src/use-create-announcement-comment', () => ({
  useCreateAnnouncementComment: jest.fn(),
}))

jest.mock('../../../../../../packages/announcements/src/use-update-announcement-comment', () => ({
  useUpdateAnnouncementComment: jest.fn(),
}))

jest.mock('../../../../../../packages/announcements/src/use-delete-announcement-comment', () => ({
  useDeleteAnnouncementComment: jest.fn(),
}))

jest.mock('../../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../../../packages/auth/src/use-profile', () => ({
  useProfile: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'a1' })),
}))

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import {
  useAnnouncementComments,
  useAnnouncements,
  useCreateAnnouncementComment,
  useDeleteAnnouncementComment,
  useUpdateAnnouncementComment,
} from '@sadhana-connect/announcements'
import { useAuth, useProfile } from '@sadhana-connect/auth'

import AnnouncementDetailScreen from './[id]'

const mockUseAnnouncements = useAnnouncements as jest.Mock
const mockUseAnnouncementComments = useAnnouncementComments as jest.Mock
const mockUseCreateAnnouncementComment = useCreateAnnouncementComment as jest.Mock
const mockUseUpdateAnnouncementComment = useUpdateAnnouncementComment as jest.Mock
const mockUseDeleteAnnouncementComment = useDeleteAnnouncementComment as jest.Mock
const mockUseAuth = useAuth as jest.Mock
const mockUseProfile = useProfile as jest.Mock

function makeAnnouncement(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'a1',
    authorId: 'mentor-9',
    templeGroupId: 'tg1',
    title: 'Temple closed Sunday',
    content: 'The temple will be closed this Sunday for cleaning.',
    isPublished: true,
    isPinned: false,
    publishedAt: '2026-01-10T00:00:00.000Z',
    expiresAt: null,
    createdAt: '2026-01-09T00:00:00.000Z',
    updatedAt: '2026-01-09T00:00:00.000Z',
    ...overrides,
  }
}

const ownComment = {
  id: 'c1',
  announcementId: 'a1',
  authorId: 'devotee-1',
  authorName: 'Devotee One',
  commentText: 'My own question',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

const otherComment = {
  id: 'c2',
  announcementId: 'a1',
  authorId: 'devotee-2',
  authorName: 'Devotee Two',
  commentText: "Someone else's question",
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('AnnouncementDetailScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [makeAnnouncement()],
    })
    mockUseAnnouncementComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
    mockUseAuth.mockReturnValue({ session: { userId: 'devotee-1' } })
    mockUseProfile.mockReturnValue({ data: { id: 'devotee-1', role: 'devotee' } })
    mockUseCreateAnnouncementComment.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockUseUpdateAnnouncementComment.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseDeleteAnnouncementComment.mockReturnValue({ mutate: jest.fn(), isPending: false })
  })

  it('shows the "no longer available" message when the announcement is missing', async () => {
    mockUseAnnouncements.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })

    const { getByText } = await render(<AnnouncementDetailScreen />)
    expect(getByText('This announcement is no longer available.')).toBeTruthy()
  })

  it('shows the announcement title and content', async () => {
    const { getByText } = await render(<AnnouncementDetailScreen />)
    expect(getByText('Temple closed Sunday')).toBeTruthy()
    expect(getByText('The temple will be closed this Sunday for cleaning.')).toBeTruthy()
  })

  it('shows an empty comments state', async () => {
    const { getByText } = await render(<AnnouncementDetailScreen />)
    expect(getByText('No questions yet.')).toBeTruthy()
  })

  it('posts a comment and resets the composer', async () => {
    const mutate = jest.fn((_text, options) => options?.onSuccess?.())
    mockUseCreateAnnouncementComment.mockReturnValue({ mutate, isPending: false, isError: false })

    const { getByLabelText, getByRole } = await render(<AnnouncementDetailScreen />)
    const composer = getByLabelText('Ask a question or leave a comment')
    await fireEvent.changeText(composer, 'When does this start?')
    await fireEvent.press(getByRole('button', { name: 'Post' }))

    expect(mutate).toHaveBeenCalledWith('When does this start?', expect.anything())
    await waitFor(() => expect(composer.props.value).toBe(''))
  })

  it("shows Edit/Delete only for the viewer's own comment when not moderating", async () => {
    mockUseAnnouncementComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownComment, otherComment],
    })

    const { getAllByRole } = await render(<AnnouncementDetailScreen />)
    expect(getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('the announcement author sees a Delete (moderation) control on a comment that is not their own', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      // Viewer (devotee-1) authored the announcement itself.
      data: [makeAnnouncement({ authorId: 'devotee-1' })],
    })
    mockUseAnnouncementComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [otherComment],
    })

    const { getByRole, queryByRole } = await render(<AnnouncementDetailScreen />)
    expect(getByRole('button', { name: 'Delete' })).toBeTruthy()
    expect(queryByRole('button', { name: 'Edit' })).toBeNull()
  })

  it('a super admin sees a Delete (moderation) control on any comment', async () => {
    mockUseAuth.mockReturnValue({ session: { userId: 'admin-1' } })
    mockUseProfile.mockReturnValue({ data: { id: 'admin-1', role: 'super_admin' } })
    mockUseAnnouncementComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [otherComment],
    })

    const { getByRole } = await render(<AnnouncementDetailScreen />)
    expect(getByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('a viewer with no relation to the comment or announcement sees neither Edit nor Delete', async () => {
    mockUseAnnouncementComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [otherComment],
    })

    const { queryByRole } = await render(<AnnouncementDetailScreen />)
    expect(queryByRole('button', { name: 'Edit' })).toBeNull()
    expect(queryByRole('button', { name: 'Delete' })).toBeNull()
  })

  it('editing own comment saves the validated text', async () => {
    mockUseAnnouncementComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownComment],
    })
    const mutate = jest.fn((_input, options) => options?.onSuccess?.())
    mockUseUpdateAnnouncementComment.mockReturnValue({ mutate, isPending: false })

    const { getByRole, getByLabelText } = await render(<AnnouncementDetailScreen />)
    await fireEvent.press(getByRole('button', { name: 'Edit' }))
    await fireEvent.changeText(getByLabelText('Edit comment'), 'Updated question')
    await fireEvent.press(getByRole('button', { name: 'Save' }))

    expect(mutate).toHaveBeenCalledWith(
      { commentId: 'c1', commentText: 'Updated question' },
      expect.anything(),
    )
  })
})
