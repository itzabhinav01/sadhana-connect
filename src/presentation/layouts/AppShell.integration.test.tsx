import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from '@/presentation/layouts/AppLayout'
import { TooltipProvider } from '@/presentation/components/ui/tooltip'
import { ProtectedRoute } from '@/presentation/routing/ProtectedRoute'

// Integration coverage for the requirement that navigation must never
// render before the authenticated profile state is known, and that a
// disabled account gets the dedicated screen instead of the shell —
// wiring ProtectedRoute and AppLayout together, the way the real router
// does, rather than testing either in isolation.

const { useAuthMock, useProfileMock, useThemeMock, signOutMutateMock } =
  vi.hoisted(() => ({
    useAuthMock: vi.fn(),
    useProfileMock: vi.fn(),
    useThemeMock: vi.fn(),
    signOutMutateMock: vi.fn(),
  }))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('@/application/profile/use-profile', () => ({
  useProfile: useProfileMock,
}))

vi.mock('@/application/theme/use-theme', () => ({
  useTheme: useThemeMock,
}))

vi.mock('@/application/auth/use-sign-out', () => ({
  useSignOut: () => ({ mutate: signOutMutateMock, isPending: false }),
}))

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <TooltipProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<div>Page content</div>} />
            </Route>
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </TooltipProvider>
    </MemoryRouter>,
  )
}

describe('Protected shell (ProtectedRoute + AppLayout)', () => {
  beforeEach(() => {
    useThemeMock.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: vi.fn(),
    })
    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
  })

  it('does not render navigation or page content while the profile is loading', () => {
    useProfileMock.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    })

    renderShell()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Primary' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Page content')).not.toBeInTheDocument()
  })

  it('shows the account-disabled screen instead of the shell when inactive', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: '1',
        fullName: 'Test Devotee',
        role: 'devotee',
        templeGroupId: null,
        isActive: false,
      },
    })

    renderShell()

    expect(screen.getByText(/account disabled/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Primary' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Page content')).not.toBeInTheDocument()
  })

  it('renders the shell and page content once the profile is active', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: '1',
        fullName: 'Test Devotee',
        role: 'devotee',
        templeGroupId: null,
        isActive: true,
      },
    })

    renderShell()

    expect(
      screen.getByRole('navigation', { name: 'Primary' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
