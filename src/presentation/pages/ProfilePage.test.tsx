import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfilePage } from '@/presentation/pages/ProfilePage'

const {
  useProfileMock,
  useUpdateProfileMock,
  mutateMock,
  useAuthMock,
  useSignOutMock,
  signOutMutateMock,
  useSadhanaStreakMock,
  useRecentSadhanaReportsMock,
  navigateMock,
} = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
  useUpdateProfileMock: vi.fn(),
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

vi.mock('@/application/profile/use-update-profile', () => ({
  useUpdateProfile: useUpdateProfileMock,
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
    useUpdateProfileMock.mockReset()
    mutateMock.mockReset()
    signOutMutateMock.mockReset()
    navigateMock.mockReset()
    useUpdateProfileMock.mockReturnValue({
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

    expect(screen.getAllByText('User One').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Devotee').length).toBeGreaterThan(0)
    expect(screen.getByText('devotee@example.com')).toBeInTheDocument()
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

  it('shows the existing phone number and Edit button', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    render(<ProfilePage />)

    expect(screen.getByText('+919876543210')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument()
  })

  it('saves new profile details and returns to view state on success', async () => {
    mutateMock.mockImplementation((_value, options) => {
      options?.onSuccess?.()
    })
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: activeProfile,
    })

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    await user.clear(screen.getByLabelText(/full name/i))
    await user.type(screen.getByLabelText(/full name/i), 'Updated Name')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mutateMock).toHaveBeenCalledWith(
        { fullName: 'Updated Name', phoneNumber: '+919876543210' },
        expect.anything(),
      ),
    )
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
