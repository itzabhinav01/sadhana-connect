import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ProtectedRoute } from '@/presentation/routing/ProtectedRoute'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
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

describe('ProtectedRoute', () => {
  it('shows a loading state while the session is resolving', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: true })
    renderProtected()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects to /login when there is no session', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })
    renderProtected()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders the protected content when a session exists', () => {
    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    renderProtected()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
