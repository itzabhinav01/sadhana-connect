jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/admin/src/use-admin-users', () => ({
  useAdminUsers: jest.fn(),
}))

jest.mock('../../../../../packages/admin/src/use-mentor-devotee-counts', () => ({
  useMentorDevoteeCounts: jest.fn(),
}))

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useAdminUsers, useMentorDevoteeCounts } from '@sadhana-connect/admin'

import AdminMentorsScreen from './mentors'

const mockUseAdminUsers = useAdminUsers as jest.Mock
const mockUseMentorDevoteeCounts = useMentorDevoteeCounts as jest.Mock

function page(users: unknown[], nextCursor: unknown = null) {
  return { pages: [{ users, nextCursor }] }
}

function makeMentor(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'mentor-1',
    fullName: 'Mentor One',
    role: 'mentor',
    templeGroupId: 'group-1',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('AdminMentorsScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockPush.mockReset()
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })
    mockUseMentorDevoteeCounts.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    })
  })

  it('shows a loading state', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByText } = await render(<AdminMentorsScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error message when either query fails', async () => {
    mockUseMentorDevoteeCounts.mockReturnValue({ isPending: false, isError: true, data: undefined })

    const { getByText } = await render(<AdminMentorsScreen />)
    expect(getByText('Something went wrong loading mentors.')).toBeTruthy()
  })

  it('shows the empty state when there are no mentors', async () => {
    const { getByText } = await render(<AdminMentorsScreen />)
    expect(getByText('No mentors yet.')).toBeTruthy()
  })

  it('shows each mentor with their active devotee count, defaulting to 0 when uncounted', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeMentor({ id: 'mentor-1', fullName: 'Mentor One' }), makeMentor({ id: 'mentor-2', fullName: 'Mentor Two' })]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })
    mockUseMentorDevoteeCounts.mockReturnValue({
      isPending: false,
      isError: false,
      data: [{ mentorId: 'mentor-1', activeDevoteeCount: 5 }],
    })

    const { getByText } = await render(<AdminMentorsScreen />)
    expect(getByText('Mentor One')).toBeTruthy()
    expect(getByText('5 active devotees')).toBeTruthy()
    expect(getByText('Mentor Two')).toBeTruthy()
    expect(getByText('0 active devotees')).toBeTruthy()
  })

  it('navigates to the mentor detail screen when a row is pressed', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeMentor({ id: 'mentor-1', fullName: 'Mentor One' })]),
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<AdminMentorsScreen />)
    await fireEvent.press(getByRole('button', { name: 'View Mentor One' }))

    expect(mockPush).toHaveBeenCalledWith('/admin/users/mentor-1')
  })

  it('shows a Load more button when there is a next page, and calls fetchNextPage', async () => {
    const fetchNextPage = jest.fn()
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([makeMentor()]),
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    })

    const { getByRole } = await render(<AdminMentorsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Load more' }))

    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })
})
