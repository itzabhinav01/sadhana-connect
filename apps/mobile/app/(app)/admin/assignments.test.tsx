jest.mock('../../../../../packages/admin/src/use-admin-users', () => ({
  useAdminUsers: jest.fn(),
}))

jest.mock('../../../../../packages/admin/src/use-admin-assignments', () => ({
  useAdminAssignments: jest.fn(),
}))

jest.mock('../../../../../packages/admin/src/use-deactivate-assignment', () => ({
  useDeactivateAssignment: jest.fn(),
}))

jest.mock('../../../../../packages/admin/src/use-assign-mentor', () => {
  const MENTOR_CAP_REACHED_MESSAGE = 'This devotee already has the maximum of 3 active mentors.'
  class MentorCapReachedError extends Error {
    constructor() {
      super(MENTOR_CAP_REACHED_MESSAGE)
      this.name = 'MentorCapReachedError'
    }
  }
  return {
    useAssignMentor: jest.fn(),
    MentorCapReachedError,
    MENTOR_CAP_REACHED_MESSAGE,
  }
})

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  MentorCapReachedError,
  useAdminAssignments,
  useAdminUsers,
  useAssignMentor,
  useDeactivateAssignment,
} from '@sadhana-connect/admin'

import AdminAssignmentsScreen from './assignments'

const mockUseAdminUsers = useAdminUsers as jest.Mock
const mockUseAdminAssignments = useAdminAssignments as jest.Mock
const mockUseDeactivateAssignment = useDeactivateAssignment as jest.Mock
const mockUseAssignMentor = useAssignMentor as jest.Mock

function page(users: unknown[]) {
  return { pages: [{ users, nextCursor: null }] }
}

const assignment = {
  id: 'a1',
  mentorId: 'm1',
  mentorName: 'Test Mentor',
  devoteeId: 'd1',
  devoteeName: 'Test Devotee',
  isActive: true,
  assignedAt: '2026-01-01T00:00:00.000Z',
  unassignedAt: null,
}

describe('AdminAssignmentsScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAdminUsers.mockReset()
    mockUseAdminAssignments.mockReset()
    mockUseDeactivateAssignment.mockReset()
    mockUseAssignMentor.mockReset()

    mockUseAdminUsers.mockImplementation(({ role }: { role: string }) =>
      role === 'devotee'
        ? { data: page([{ id: 'd1', fullName: 'Test Devotee' }]) }
        : { data: page([{ id: 'm1', fullName: 'Test Mentor' }]) },
    )
    mockUseAdminAssignments.mockReturnValue({ isPending: false, isError: false, data: [] })
    mockUseDeactivateAssignment.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseAssignMentor.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    })
  })

  it('searches, selects a devotee and mentor, and assigns', async () => {
    const mockMutate = jest.fn()
    mockUseAssignMentor.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
    })

    const { getByRole, getByLabelText } = await render(<AdminAssignmentsScreen />)

    await fireEvent.changeText(getByLabelText('Search devotee'), 'Test')
    await fireEvent.press(getByRole('button', { name: 'Select Test Devotee' }))
    await fireEvent.changeText(getByLabelText('Search mentor'), 'Test')
    await fireEvent.press(getByRole('button', { name: 'Select Test Mentor' }))
    await fireEvent.press(getByRole('button', { name: 'Assign' }))

    expect(mockMutate).toHaveBeenCalledWith(
      { devoteeId: 'd1', mentorId: 'm1' },
      expect.anything(),
    )
  })

  it('shows the cap-reached message on MentorCapReachedError', async () => {
    mockUseAssignMentor.mockReturnValue({
      mutate: (_input: unknown, options: { onError?: (e: Error) => void }) =>
        options?.onError?.(new MentorCapReachedError()),
      isPending: false,
      isError: true,
      isSuccess: false,
    })

    const { getByRole, getByLabelText, getByText } = await render(<AdminAssignmentsScreen />)

    await fireEvent.changeText(getByLabelText('Search devotee'), 'Test')
    await fireEvent.press(getByRole('button', { name: 'Select Test Devotee' }))
    await fireEvent.changeText(getByLabelText('Search mentor'), 'Test')
    await fireEvent.press(getByRole('button', { name: 'Select Test Mentor' }))
    await fireEvent.press(getByRole('button', { name: 'Assign' }))

    expect(getByText('This devotee already has the maximum of 3 active mentors.')).toBeTruthy()
  })

  it('shows an empty state when there are no assignments', async () => {
    const { getByText } = await render(<AdminAssignmentsScreen />)
    expect(getByText('No assignments yet.')).toBeTruthy()
  })

  it('deactivates an active assignment', async () => {
    const mockDeactivate = jest.fn()
    mockUseAdminAssignments.mockReturnValue({ isPending: false, isError: false, data: [assignment] })
    mockUseDeactivateAssignment.mockReturnValue({ mutate: mockDeactivate, isPending: false })

    const { getByRole } = await render(<AdminAssignmentsScreen />)
    await fireEvent.press(getByRole('button', { name: 'Deactivate' }))

    expect(mockDeactivate).toHaveBeenCalledWith('a1')
  })
})
