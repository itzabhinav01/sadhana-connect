import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { PublicOnlyRoute } from '@/presentation/routing/PublicOnlyRoute'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('@sadhana-connect/auth', () => ({
  useAuth: useAuthMock,
}))

function renderPublicOnly(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<div>Login page</div>} />
        </Route>
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublicOnlyRoute', () => {
  it('shows a loading state while the session is resolving', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: true })
    renderPublicOnly()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the public page when there is no session', () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false })
    renderPublicOnly()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects to / when a session already exists', () => {
    useAuthMock.mockReturnValue({
      session: { userId: '1', email: 'a@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    renderPublicOnly()
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })
})
