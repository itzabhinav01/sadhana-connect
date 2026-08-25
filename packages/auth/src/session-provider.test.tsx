import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from './session-provider'
import { useAuth } from './use-auth'

const { getSessionMock, onAuthStateChangeMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
}))

vi.mock('@sadhana-connect/infra-supabase', () => ({
  supabaseAuthRepository: {
    getSession: getSessionMock,
    onAuthStateChange: onAuthStateChangeMock,
  },
}))

function Probe() {
  const { session, isLoading } = useAuth()
  return (
    <div>
      <span>loading:{String(isLoading)}</span>
      <span>email:{session?.email ?? 'none'}</span>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    getSessionMock.mockReset()
    onAuthStateChangeMock.mockReset()
    onAuthStateChangeMock.mockReturnValue(() => {})
  })

  it('starts loading, then resolves with the initial session', async () => {
    getSessionMock.mockResolvedValue({
      userId: '1',
      email: 'devotee@example.com',
      emailConfirmedAt: null,
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByText('loading:true')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument()
    })
    expect(screen.getByText('email:devotee@example.com')).toBeInTheDocument()
  })

  it('unsubscribes from auth state changes on unmount', () => {
    const unsubscribe = vi.fn()
    onAuthStateChangeMock.mockReturnValue(unsubscribe)
    getSessionMock.mockResolvedValue(null)

    const { unmount } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
