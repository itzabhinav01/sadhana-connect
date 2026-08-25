import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from '@/presentation/layouts/AppLayout'
import { TooltipProvider } from '@/presentation/components/ui/tooltip'

const {
  useAuthMock,
  useProfileMock,
  useThemeMock,
  signOutMutateMock,
  navigateMock,
  useUnreadNotificationCountMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useProfileMock: vi.fn(),
  useThemeMock: vi.fn(),
  signOutMutateMock: vi.fn(),
  navigateMock: vi.fn(),
  useUnreadNotificationCountMock: vi.fn(),
}))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
  useProfile: useProfileMock,
}))

vi.mock('@/application/theme/use-theme', () => ({
  useTheme: useThemeMock,
}))

vi.mock('@/application/auth/use-sign-out', () => ({
  useSignOut: () => ({ mutate: signOutMutateMock, isPending: false }),
}))

// Live-update wiring is exercised by use-notifications-realtime's own
// test suite — a real (unmocked) call here would need a QueryClient
// this test file never sets up, since every other hook in this shell is
// also mocked at this same level rather than run for real.
vi.mock('@/application/notifications/use-notifications-realtime', () => ({
  useNotificationsRealtime: vi.fn(),
}))

vi.mock('@/application/notifications/use-unread-notification-count', () => ({
  useUnreadNotificationCount: useUnreadNotificationCountMock,
}))

// OfflineBanner/UpdatePrompt are covered by their own test suites —
// mocked here at the hook boundary so this shell test isn't also
// exercising navigator.onLine/service-worker registration.
vi.mock('@/application/pwa/use-online-status', () => ({
  useOnlineStatus: () => true,
}))

vi.mock('@/application/pwa/use-service-worker-update', () => ({
  useServiceWorkerUpdate: () => ({
    needRefresh: false,
    refresh: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

// A data router (not <MemoryRouter>/<Routes>) — AppLayout's
// useNavigation() call (Phase 20, drives the lazy-route loading
// indicator) only works inside a data router context.
function renderAppLayout(initialPath = '/') {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <div>Home content</div> },
          { path: '/profile', element: <div>Profile content</div> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )
  return render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    signOutMutateMock.mockReset()
    navigateMock.mockReset()

    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'devotee@example.com', emailConfirmedAt: null },
      isLoading: false,
    })
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
    useThemeMock.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: vi.fn(),
    })
    useUnreadNotificationCountMock.mockReturnValue({ data: 0 })
  })

  it('renders the shell with the routed page content', () => {
    renderAppLayout()
    expect(screen.getByText('Home content')).toBeInTheDocument()
  })

  it('renders the foundation navigation items for the current role', () => {
    renderAppLayout()

    // Desktop sidebar nav (mobile drawer nav only renders once opened).
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(
      within(nav).getByRole('link', { name: /profile/i }),
    ).toBeInTheDocument()
    expect(
      within(nav).getByRole('link', { name: /settings/i }),
    ).toBeInTheDocument()
  })

  it('shows the theme toggle control', () => {
    renderAppLayout()
    expect(
      screen.getByRole('button', { name: /switch to dark theme/i }),
    ).toBeInTheDocument()
  })

  it('opens the account menu with name, email, and role', async () => {
    const user = userEvent.setup()
    renderAppLayout()

    await user.click(screen.getByRole('button', { name: /account menu/i }))

    expect(await screen.findByText('Test Devotee')).toBeInTheDocument()
    expect(screen.getByText('devotee@example.com')).toBeInTheDocument()
    expect(screen.getByText('Devotee')).toBeInTheDocument()
  })

  it('signs out and redirects to /login from the account menu', async () => {
    signOutMutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.()
    })
    const user = userEvent.setup()
    renderAppLayout()

    await user.click(screen.getByRole('button', { name: /account menu/i }))
    await user.click(await screen.findByText(/log out/i))

    expect(signOutMutateMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('opens the mobile navigation drawer and navigates to its links', async () => {
    const user = userEvent.setup()
    renderAppLayout()

    const trigger = screen.getByRole('button', { name: /open navigation menu/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('link', { name: /profile/i }),
    ).toBeInTheDocument()
  })

  it('shows the notification bell for a devotee', () => {
    renderAppLayout()

    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute(
      'href',
      '/notifications',
    )
  })

  it('shows an unread-count badge on the bell when there are unread notifications', () => {
    useUnreadNotificationCountMock.mockReturnValue({ data: 3 })

    renderAppLayout()

    expect(
      screen.getByRole('link', { name: 'Notifications, 3 unread' }),
    ).toBeInTheDocument()
  })

  it('never shows the notification bell for a mentor', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: '1',
        fullName: 'Test Mentor',
        role: 'mentor',
        templeGroupId: null,
        isActive: true,
      },
    })

    renderAppLayout()

    expect(screen.queryByRole('link', { name: /notifications/i })).not.toBeInTheDocument()
  })

  it('never renders the offline banner while online', () => {
    renderAppLayout()

    expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument()
  })

  it('never shows the notification bell for a super admin', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: '1',
        fullName: 'Test Admin',
        role: 'super_admin',
        templeGroupId: null,
        isActive: true,
      },
    })

    renderAppLayout()

    expect(screen.queryByRole('link', { name: /notifications/i })).not.toBeInTheDocument()
  })
})
