jest.mock('../../../../../packages/announcements/src/use-announcements', () => ({
  useAnnouncements: jest.fn(),
}))

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useAnnouncements } from '@sadhana-connect/announcements'

import AnnouncementsFeedScreen from './announcements'

const mockUseAnnouncements = useAnnouncements as jest.Mock

function makeAnnouncement(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'a1',
    authorId: 'mentor-1',
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

describe('AnnouncementsFeedScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockPush.mockReset()
  })

  it('shows a loading state', async () => {
    mockUseAnnouncements.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined })

    const { getByText } = await render(<AnnouncementsFeedScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error state', async () => {
    mockUseAnnouncements.mockReturnValue({ isPending: false, isError: true, isSuccess: false, data: undefined })

    const { getByText } = await render(<AnnouncementsFeedScreen />)
    expect(getByText('Something went wrong loading announcements.')).toBeTruthy()
  })

  it('shows the empty state when there are no announcements', async () => {
    mockUseAnnouncements.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] })

    const { getByText } = await render(<AnnouncementsFeedScreen />)
    expect(getByText('No announcements yet.')).toBeTruthy()
  })

  it('renders each announcement with a Pinned badge when pinned', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [makeAnnouncement({ id: 'a1', title: 'First', isPinned: true }), makeAnnouncement({ id: 'a2', title: 'Second' })],
    })

    const { getByText, getAllByText } = await render(<AnnouncementsFeedScreen />)
    expect(getByText('First')).toBeTruthy()
    expect(getByText('Second')).toBeTruthy()
    expect(getAllByText('Pinned')).toHaveLength(1)
  })

  it('navigates to the announcement detail screen when a card is pressed', async () => {
    mockUseAnnouncements.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [makeAnnouncement({ id: 'a1', title: 'Temple closed Sunday' })],
    })

    const { getByRole } = await render(<AnnouncementsFeedScreen />)
    await fireEvent.press(getByRole('button', { name: 'Temple closed Sunday' }))

    expect(mockPush).toHaveBeenCalledWith('/devotee/announcements/a1')
  })
})
