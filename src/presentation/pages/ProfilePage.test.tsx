import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfilePage } from '@/presentation/pages/ProfilePage'

const {
  useProfileMock,
  useUpdatePhoneNumberMock,
  mutateMock,
  useAuthMock,
  useSignOutMock,
  signOutMutateMock,
  useSadhanaStreakMock,
  useRecentSadhanaReportsMock,
  navigateMock,
} = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useUpdatePhoneNumberMock: vi.fn(),
  mutateMock: vi.fn(),
  useAuthMock: vi.fn(),
  useSignOutMock: vi.fn(),
  signOutMutateMock: vi.fn(),
  useSadhanaStreakMock: vi.fn(),
  useRecentSadhanaReportsMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/auth')>()
  return {
    ...actual,
    useProfile: useProfileMock,
    useAuth: useAuthMock,
  }
})

vi.mock('@sadhana-connect/sadhana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/sadhana')>()
  return {
    ...actual,
    useSadhanaStreak: useSadhanaStreakMock,
    useRecentSadhanaReports: useRecentSadhanaReportsMock,
  }
})

vi.mock('@/application/profile/use-update-phone-number', () => ({
  useUpdatePhoneNumber: useUpdatePhoneNumberMock,
}))

vi.mock('@/application/auth/use-sign-out', () => ({
  useSignOut: useSignOutMock,
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const activeProfile = {
  id: 'user-1',
  fullName: 'User One',
  role: 'devotee' as const,
  templeGroupId: null,
  isActive: true,
  phoneNumber: '+919876543210',
}

describe('ProfilePage', () => {
  beforeEach(() => {
    useProfileMock.mockReset()
    useUpdatePhoneNumberMock.mockReset()
    mutateMock.mockReset()
    signOutMutateMock.mockReset()
    navigateMock.mockReset()
    useUpdatePhoneNumberMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: false,
    })
    useAuthMock.mockReturnValue({ session: { userId: 'user-1', email: 'devotee@example.com' } })
    useSignOutMock.mockReturnValue({ mutate: signOutMutateMock, isPending: false })
    useSadhanaStreakMock.mockReturnValue({ data: 5 })
    useRecentSadhanaReportsMock.mockReturnValue({ data: [{ id: 'r1' }, { id: 'r2' }] })
  })

  it('shows a loading state while the profile is pending', () => {
    useProfileMock.mockReturnValue({ isPending: true, isError: false, data: undefined })

    render(<ProfilePage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state when the profile fails to load', () => {
    useProfileMock.mockReturnValue({ isPending: false, isError: true, data: undefined })

    render(<ProfilePage />)

    expect(
      screen.getByText(/something went wrong loading your profile/i),
    ).toBeInTheDocument()
  })

  it('shows the identity header and devotee streak/report stats', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    render(<ProfilePage />)

    expect(screen.getByText('User One')).toBeInTheDocument()
    expect(screen.getByText('Devotee')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show devotee stats for a mentor', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, role: 'mentor' as const },
    })

    render(<ProfilePage />)

    expect(screen.queryByText('This Week')).not.toBeInTheDocument()
  })

  it('shows the existing phone number with an Edit action', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    render(<ProfilePage />)

    expect(screen.getByText('+919876543210')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('shows "Not provided" with an Add action when there is no phone number yet', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    render(<ProfilePage />)

    expect(screen.getByText('Not provided')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('saves a new phone number and returns to the view state on success', async () => {
    mutateMock.mockImplementation((_value, options) => {
      options?.onSuccess?.()
    })
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /add/i }))
    await user.type(
      screen.getByPlaceholderText('+919876543210'),
      '+919876543210',
    )
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith(
      '+919876543210',
      expect.anything(),
    ))
    // The mocked profile query still returns phoneNumber: null (it isn't
    // refetched), so leaving edit mode falls back to the "Add" action.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument(),
    )
  })

  it('does not submit an invalid phone number', async () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile, phoneNumber: null },
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /add/i }))
    await user.type(screen.getByPlaceholderText('+919876543210'), '12345')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('discards edits when Cancel is clicked', async () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByPlaceholderText('+919876543210'))
    await user.type(screen.getByPlaceholderText('+919876543210'), '+911111111111')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByText('+919876543210')).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('shows an inline error in the edit form when the update failed', async () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })
    useUpdatePhoneNumberMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: true,
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(
      screen.getByText(/something went wrong saving your phone number/i),
    ).toBeInTheDocument()
  })

  it('signs out and redirects to /login when "Sign out" is pressed', async () => {
    signOutMutateMock.mockImplementation((_arg, options) => options?.onSuccess?.())
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(signOutMutateMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })
})
