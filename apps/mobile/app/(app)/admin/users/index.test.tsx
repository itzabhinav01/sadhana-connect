jest.mock('../../../../../../packages/admin/src/use-admin-users', () => ({
  useAdminUsers: jest.fn(),
}))

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useAdminUsers } from '@sadhana-connect/admin'

import AdminUsersScreen from './index'

const mockUseAdminUsers = useAdminUsers as jest.Mock

const devoteeUser = {
  id: 'u1',
  fullName: 'Test Devotee',
  role: 'devotee' as const,
  isActive: true,
  templeGroupId: null,
  phoneNumber: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function page(users: unknown[], hasNextPage = false) {
  return { pages: [{ users, nextCursor: hasNextPage ? 'cursor-1' : null }] }
}

describe('AdminUsersScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAdminUsers.mockReset()
    mockPush.mockReset()
  })

  it('shows a loading state while pending', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
    })

    const { getByText } = await render(<AdminUsersScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error state', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      hasNextPage: false,
    })

    const { getByText } = await render(<AdminUsersScreen />)
    expect(getByText(/something went wrong loading users/i)).toBeTruthy()
  })

  it('shows an empty state when no users match', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([]),
      hasNextPage: false,
    })

    const { getByText } = await render(<AdminUsersScreen />)
    expect(getByText('No users match these filters.')).toBeTruthy()
  })

  it('re-queries with the role filter when a role button is pressed', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([devoteeUser]),
      hasNextPage: false,
    })

    const { getByRole } = await render(<AdminUsersScreen />)
    await fireEvent.press(getByRole('button', { name: 'Mentor' }))

    expect(mockUseAdminUsers).toHaveBeenLastCalledWith({ role: 'mentor' })
  })

  it('navigates to the user detail screen on row press', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([devoteeUser]),
      hasNextPage: false,
    })

    const { getByRole } = await render(<AdminUsersScreen />)
    await fireEvent.press(getByRole('button', { name: 'View Test Devotee' }))

    expect(mockPush).toHaveBeenCalledWith('/admin/users/u1')
  })

  it('shows a Load more button when there is a next page', async () => {
    mockUseAdminUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: page([devoteeUser]),
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    })

    const { getByRole } = await render(<AdminUsersScreen />)
    expect(getByRole('button', { name: 'Load more' })).toBeTruthy()
  })
})
