import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HomePage } from '@/presentation/pages/HomePage'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

describe('HomePage', () => {
  it('shows the signed-in user email', () => {
    useAuthMock.mockReturnValue({
      session: {
        userId: '1',
        email: 'devotee@example.com',
        emailConfirmedAt: null,
      },
      isLoading: false,
    })

    render(<HomePage />)

    expect(screen.getByText(/devotee@example.com/)).toBeInTheDocument()
  })
})
