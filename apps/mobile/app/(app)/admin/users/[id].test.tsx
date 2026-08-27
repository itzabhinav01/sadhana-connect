jest.mock('../../../../../../packages/admin/src/use-admin-user-detail', () => ({
  useAdminUserDetail: jest.fn(),
}))

jest.mock('../../../../../../packages/admin/src/use-mentor-devotee-count', () => ({
  useMentorDevoteeCount: jest.fn(),
}))

jest.mock('../../../../../../packages/admin/src/use-admin-assignments', () => ({
  useAdminAssignments: jest.fn(),
}))

jest.mock('../../../../../../packages/admin/src/use-deactivate-assignment', () => ({
  useDeactivateAssignment: jest.fn(),
}))

jest.mock('../../../../../../packages/admin/src/use-set-user-active', () => ({
  useSetUserActive: jest.fn(),
}))

jest.mock('../../../../../../packages/admin/src/use-change-user-role', () => {
  const MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE =
    'This mentor has active devotees and cannot change roles right now.'
  class MentorHasActiveDevoteesError extends Error {
    constructor() {
      super(MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE)
      this.name = 'MentorHasActiveDevoteesError'
    }
  }
  return {
    useChangeUserRole: jest.fn(),
    MentorHasActiveDevoteesError,
    MENTOR_HAS_ACTIVE_DEVOTEES_MESSAGE,
  }
})

jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Stack: { Screen: () => <View /> },
    useLocalSearchParams: jest.fn(() => ({ id: 'u1' })),
  }
})

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  useAdminAssignments,
  useAdminUserDetail,
  useChangeUserRole,
  useDeactivateAssignment,
  useMentorDevoteeCount,
  useSetUserActive,
} from '@sadhana-connect/admin'

import AdminUserDetailScreen from './[id]'

const mockUseAdminUserDetail = useAdminUserDetail as jest.Mock
const mockUseMentorDevoteeCount = useMentorDevoteeCount as jest.Mock
const mockUseAdminAssignments = useAdminAssignments as jest.Mock
const mockUseDeactivateAssignment = useDeactivateAssignment as jest.Mock
const mockUseSetUserActive = useSetUserActive as jest.Mock
const mockUseChangeUserRole = useChangeUserRole as jest.Mock

const devoteeUser = {
  id: 'u1',
  fullName: 'Test Devotee',
  role: 'devotee' as const,
  isActive: true,
  templeGroupId: null,
  phoneNumber: '+919876543210',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mentorUser = { ...devoteeUser, id: 'm1', fullName: 'Test Mentor', role: 'mentor' as const }

describe('AdminUserDetailScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAdminUserDetail.mockReset()
    mockUseMentorDevoteeCount.mockReset()
    mockUseAdminAssignments.mockReset()
    mockUseDeactivateAssignment.mockReset()
    mockUseSetUserActive.mockReset()
    mockUseChangeUserRole.mockReset()

    mockUseMentorDevoteeCount.mockReturnValue({ isPending: false, data: 0 })
    mockUseAdminAssignments.mockReturnValue({ isPending: false, data: [] })
    mockUseDeactivateAssignment.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseSetUserActive.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseChangeUserRole.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
  })

  it('shows a loading state while pending', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: true, isError: false, data: undefined })

    const { getByText } = await render(<AdminUserDetailScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it("shows the not-available message when the user isn't found", async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: null })

    const { getByText } = await render(<AdminUserDetailScreen />)
    expect(getByText("This user isn't available.")).toBeTruthy()
  })

  it('renders the phone number and account status', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })

    const { getByText } = await render(<AdminUserDetailScreen />)
    expect(getByText('Test Devotee')).toBeTruthy()
    expect(getByText('+919876543210')).toBeTruthy()
    expect(getByText('Active')).toBeTruthy()
  })

  it("shows the mentor's assigned devotee count for a mentor", async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: mentorUser })
    mockUseMentorDevoteeCount.mockReturnValue({ isPending: false, data: 3 })

    const { getByText } = await render(<AdminUserDetailScreen />)
    expect(getByText('3')).toBeTruthy()
  })

  it("removes a devotee's mentor via the Remove button", async () => {
    const mockDeactivate = jest.fn()
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseAdminAssignments.mockReturnValue({
      isPending: false,
      data: [{ id: 'a1', mentorId: 'm1', mentorName: 'Test Mentor', devoteeId: 'u1', devoteeName: 'Test Devotee', isActive: true, assignedAt: '2026-01-01T00:00:00.000Z', unassignedAt: null }],
    })
    mockUseDeactivateAssignment.mockReturnValue({ mutate: mockDeactivate, isPending: false })

    const { getByRole } = await render(<AdminUserDetailScreen />)
    await fireEvent.press(getByRole('button', { name: 'Remove' }))

    expect(mockDeactivate).toHaveBeenCalledWith('a1')
  })

  it('disables saving the role change when demoting a mentor with active devotees', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: mentorUser })
    mockUseMentorDevoteeCount.mockReturnValue({ isPending: false, data: 2 })

    const { getByRole, getByText } = await render(<AdminUserDetailScreen />)
    await fireEvent.press(getByRole('button', { name: 'Devotee' }))

    expect(getByText(/active devotees and cannot change roles/i)).toBeTruthy()
    expect(getByRole('button', { name: 'Save role' }).props.accessibilityState.disabled).toBe(true)
  })

  it('toggles account status via the lifecycle button', async () => {
    const mockSetActive = jest.fn()
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseSetUserActive.mockReturnValue({ mutate: mockSetActive, isPending: false })

    const { getByRole } = await render(<AdminUserDetailScreen />)
    await fireEvent.press(getByRole('button', { name: 'Disable account' }))

    expect(mockSetActive).toHaveBeenCalledWith({ userId: 'u1', isActive: false })
  })
})
