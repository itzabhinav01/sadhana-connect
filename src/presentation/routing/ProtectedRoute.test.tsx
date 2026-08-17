import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ProtectedRoute } from '@/presentation/routing/ProtectedRoute'

const { useAuthMock, useProfileMock, signOutMutateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useProfileMock: vi.fn(),
  signOutMutateMock: vi.fn(),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@/application/profile/use-profile', () => ({
  useProfile: useProfileMock,
}))

// AccountDisabledPage (rendered for the disabled-profile branch) pulls in
// useSignOut, which needs a QueryClientProvider ancestor we don't set up
// here — mock it the same way HomePage.test.tsx mocks it.
vi.mock('@/application/auth/use-sign-out', () => ({
  useSignOut: () => ({ mutate: signOutMutateMock, isPending: false }),
}))

function renderProtected(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const activeProfile = {
  isPending: false,
  isError: false,
  data: {
    id: '1',
    fullName: 'Test Devotee',
    role: 'devotee' as const,
    templeGroupId: null,
    isActive: true,
  },
}

describe('ProtectedRoute', () => {
  it('shows a loading state while the session is resolving', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: true })
    useProfileMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })
    renderProtected()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects to /login when there is no session', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: undefined,
    })
    renderProtected()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('shows a loading state while the profile is resolving', () => {
    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })
    renderProtected()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state when the profile fails to load', () => {
    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    })
    renderProtected()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows the account-disabled screen when the profile is inactive', () => {
    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...activeProfile.data, isActive: false },
    })
    renderProtected()
    expect(screen.getByText(/account disabled/i)).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content when a session and active profile exist', () => {
    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    useProfileMock.mockReturnValue(activeProfile)
    renderProtected()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
