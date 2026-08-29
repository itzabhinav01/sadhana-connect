jest.mock('../../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

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

jest.mock('../../../../../../packages/admin/src/use-generate-recovery-link', () => ({
  useGenerateRecoveryLink: jest.fn(),
}))

jest.mock('../../../../../../packages/admin/src/use-admin-temple-groups', () => ({
  useAdminTempleGroups: jest.fn(),
}))

jest.mock('../../../../../../packages/admin/src/use-set-user-temple-group', () => ({
  useSetUserTempleGroup: jest.fn(),
}))

jest.mock('../../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(() => ({
    session: { userId: 'admin-1', email: 'a@b.com', emailConfirmedAt: null },
    isLoading: false,
  })),
}))

jest.mock('../../../../../../packages/sadhana/src/use-devotee-report-history', () => ({
  useDevoteeReportHistory: jest.fn(),
}))

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}))

jest.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseAdminAccountActionsRepository: {
    getUserEmail: jest.fn().mockResolvedValue('testuser@example.com'),
  },
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

jest.mock('../../../../../../packages/admin/src/use-hard-delete-user', () => ({
  useHardDeleteUser: jest.fn(),
}))

const mockReplace = jest.fn()

jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Stack: { Screen: () => <View /> },
    useLocalSearchParams: jest.fn(() => ({ id: 'u1' })),
    useRouter: () => ({ replace: mockReplace }),
  }
})

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useAdminAssignments,
  useAdminTempleGroups,
  useAdminUserDetail,
  useChangeUserRole,
  useDeactivateAssignment,
  useGenerateRecoveryLink,
  useHardDeleteUser,
  useMentorDevoteeCount,
  useSetUserActive,
  useSetUserTempleGroup,
} from '@sadhana-connect/admin'
import { useDevoteeReportHistory } from '@sadhana-connect/sadhana'
import * as Clipboard from 'expo-clipboard'

import AdminUserDetailScreen from './[id]'

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminUserDetailScreen />
    </QueryClientProvider>,
  )
}

const mockUseAdminUserDetail = useAdminUserDetail as jest.Mock
const mockUseMentorDevoteeCount = useMentorDevoteeCount as jest.Mock
const mockUseAdminAssignments = useAdminAssignments as jest.Mock
const mockUseDeactivateAssignment = useDeactivateAssignment as jest.Mock
const mockUseSetUserActive = useSetUserActive as jest.Mock
const mockUseChangeUserRole = useChangeUserRole as jest.Mock
const mockUseGenerateRecoveryLink = useGenerateRecoveryLink as jest.Mock
const mockUseAdminTempleGroups = useAdminTempleGroups as jest.Mock
const mockUseSetUserTempleGroup = useSetUserTempleGroup as jest.Mock
const mockUseHardDeleteUser = useHardDeleteUser as jest.Mock
const mockUseDevoteeReportHistory = useDevoteeReportHistory as jest.Mock
const mockSetStringAsync = Clipboard.setStringAsync as jest.Mock

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
  jest.setTimeout(15000)

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
    mockUseGenerateRecoveryLink.mockReset()
    mockUseAdminTempleGroups.mockReset()
    mockUseSetUserTempleGroup.mockReset()
    mockUseHardDeleteUser.mockReset()
    mockUseDevoteeReportHistory.mockReset()
    mockSetStringAsync.mockReset()
    mockReplace.mockReset()

    mockUseMentorDevoteeCount.mockReturnValue({ isPending: false, data: 0 })
    mockUseAdminAssignments.mockReturnValue({ isPending: false, data: [] })
    mockUseDeactivateAssignment.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseSetUserActive.mockReturnValue({ mutate: jest.fn(), isPending: false })
    mockUseHardDeleteUser.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false, reset: jest.fn() })
    mockUseChangeUserRole.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockUseGenerateRecoveryLink.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    })
    mockUseAdminTempleGroups.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        { id: 'g1', name: 'ISKCON Delhi', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'g2', name: 'ISKCON Mumbai', createdAt: '2026-01-01T00:00:00.000Z' },
      ],
    })
    mockUseSetUserTempleGroup.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockUseDevoteeReportHistory.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })
  })

  it('shows a loading state while pending', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: true, isError: false, data: undefined })

    const { getByText } = await renderScreen()
    expect(getByText('Loading…')).toBeTruthy()
  })

  it("shows the not-available message when the user isn't found", async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: null })

    const { getByText } = await renderScreen()
    expect(getByText("This user isn't available.")).toBeTruthy()
  })

  it('renders the phone number and account status', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })

    const { getByText } = await renderScreen()
    expect(getByText('Test Devotee')).toBeTruthy()
    expect(getByText('+919876543210')).toBeTruthy()
    expect(getByText('Active')).toBeTruthy()
  })

  it("shows the devotee's Sadhana History section", async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseDevoteeReportHistory.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [{ id: 'r1', reportDate: '2026-01-15', totalRounds: 16, readingMinutes: 20, hearingMinutes: 10 }],
    })

    const { getByText, queryByRole } = await renderScreen()
    expect(getByText('Sadhana History')).toBeTruthy()
    expect(getByText(/16 rounds · 20m reading · 10m hearing/)).toBeTruthy()
    // Admin can view, but not comment — that's mentor-only.
    expect(queryByRole('button', { name: 'Comments' })).toBeNull()
  })

  it("shows the mentor's assigned devotee count for a mentor", async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: mentorUser })
    mockUseMentorDevoteeCount.mockReturnValue({ isPending: false, data: 3 })

    const { getByText } = await renderScreen()
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

    const { getByRole } = await renderScreen()
    await fireEvent.press(getByRole('button', { name: 'Remove' }))

    expect(mockDeactivate).toHaveBeenCalledWith('a1')
  })

  it('disables saving the role change when demoting a mentor with active devotees', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: mentorUser })
    mockUseMentorDevoteeCount.mockReturnValue({ isPending: false, data: 2 })

    const { getByRole, getByText } = await renderScreen()
    await fireEvent.press(getByRole('button', { name: 'Devotee' }))

    expect(getByText(/active devotees and cannot change roles/i)).toBeTruthy()
    expect(getByRole('button', { name: 'Save role' }).props.accessibilityState.disabled).toBe(true)
  })

  it('toggles account status via the lifecycle button', async () => {
    const mockSetActive = jest.fn()
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseSetUserActive.mockReturnValue({ mutate: mockSetActive, isPending: false })

    const { getByRole } = await renderScreen()
    await fireEvent.press(getByRole('button', { name: 'Disable account' }))

    expect(mockSetActive).toHaveBeenCalledWith({ userId: 'u1', isActive: false })
  })

  it('generates and shows a one-time recovery link, then copies it to the clipboard', async () => {
    const mockGenerate = jest.fn((_userId, { onSuccess }: { onSuccess: (link: string) => void }) =>
      onSuccess('https://example.supabase.co/auth/v1/verify?token=abc'),
    )
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseGenerateRecoveryLink.mockReturnValue({
      mutate: mockGenerate,
      isPending: false,
      isError: false,
      reset: jest.fn(),
    })

    const { getByRole, getByText } = await renderScreen()
    await fireEvent.press(getByRole('button', { name: 'Generate recovery link' }))

    expect(mockGenerate).toHaveBeenCalledWith('u1', { onSuccess: expect.any(Function) })
    expect(getByText('https://example.supabase.co/auth/v1/verify?token=abc')).toBeTruthy()

    await fireEvent.press(getByRole('button', { name: 'Copy link' }))
    expect(mockSetStringAsync).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/verify?token=abc',
    )
    expect(getByText('Copied')).toBeTruthy()
  })

  it('closing the recovery link modal discards the link', async () => {
    const mockReset = jest.fn()
    const mockGenerate = jest.fn((_userId, { onSuccess }: { onSuccess: (link: string) => void }) =>
      onSuccess('https://example.supabase.co/auth/v1/verify?token=abc'),
    )
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseGenerateRecoveryLink.mockReturnValue({
      mutate: mockGenerate,
      isPending: false,
      isError: false,
      reset: mockReset,
    })

    const { getByRole, queryByText } = await renderScreen()
    await fireEvent.press(getByRole('button', { name: 'Generate recovery link' }))
    await fireEvent.press(getByRole('button', { name: 'Close' }))

    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(queryByText('https://example.supabase.co/auth/v1/verify?token=abc')).toBeNull()
  })

  it('shows an error message when generating a recovery link fails', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseGenerateRecoveryLink.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: true,
      reset: jest.fn(),
    })

    const { getByText } = await renderScreen()
    expect(getByText('Could not generate a recovery link.')).toBeTruthy()
  })

  it('assigns a temple group to a devotee', async () => {
    const mockSetTempleGroup = jest.fn()
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseSetUserTempleGroup.mockReturnValue({
      mutate: mockSetTempleGroup,
      isPending: false,
      isError: false,
    })

    const { getByRole } = await renderScreen()
    await fireEvent.press(getByRole('button', { name: 'ISKCON Mumbai' }))

    expect(mockSetTempleGroup).toHaveBeenCalledWith({ userId: 'u1', templeGroupId: 'g2' })
  })

  it('clears a temple group assignment via the None button', async () => {
    const mockSetTempleGroup = jest.fn()
    mockUseAdminUserDetail.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...devoteeUser, templeGroupId: 'g1' },
    })
    mockUseSetUserTempleGroup.mockReturnValue({
      mutate: mockSetTempleGroup,
      isPending: false,
      isError: false,
    })

    const { getByRole } = await renderScreen()
    await fireEvent.press(getByRole('button', { name: 'None' }))

    expect(mockSetTempleGroup).toHaveBeenCalledWith({ userId: 'u1', templeGroupId: null })
  })

  it('does not show a temple group panel for a super admin', async () => {
    mockUseAdminUserDetail.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...devoteeUser, role: 'super_admin' },
    })

    const { queryByText } = await renderScreen()
    expect(queryByText('Temple group')).toBeNull()
  })

  it('shows an error message when updating the temple group fails', async () => {
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })
    mockUseSetUserTempleGroup.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: true })

    const { getByText } = await renderScreen()
    expect(getByText('Something went wrong updating the temple group.')).toBeTruthy()
  })

  it('opens delete account modal and deletes user when name is confirmed', async () => {
    const mockHardDelete = jest.fn((_id, options) => options?.onSuccess?.())
    mockUseHardDeleteUser.mockReturnValue({
      mutate: mockHardDelete,
      isPending: false,
      isError: false,
      reset: jest.fn(),
    })
    mockUseAdminUserDetail.mockReturnValue({ isPending: false, isError: false, data: devoteeUser })

    const { getByRole, getByPlaceholderText, getByText } = await renderScreen()

    await fireEvent.press(getByRole('button', { name: 'Delete account' }))
    expect(getByText('Delete Account Permanently')).toBeTruthy()

    await fireEvent.changeText(getByPlaceholderText('Test Devotee'), 'Test Devotee')
    await fireEvent.press(getByRole('button', { name: 'Confirm delete' }))

    expect(mockHardDelete).toHaveBeenCalledWith('u1', expect.anything())
    expect(mockReplace).toHaveBeenCalledWith('/admin/users')
  })
})
