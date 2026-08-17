import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '@/presentation/pages/HomePage'

const { mutateMock, navigateMock, useAuthMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  navigateMock: vi.fn(),
  useAuthMock: vi.fn(),
}))

vi.mock('@/application/auth/use-sign-out', () => ({
  useSignOut: () => ({ mutate: mutateMock, isPending: false }),
}))

vi.mock('@/application/auth/use-auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

describe('HomePage', () => {
  beforeEach(() => {
    mutateMock.mockReset()
    navigateMock.mockReset()
    useAuthMock.mockReturnValue({
      session: {
        userId: '1',
        email: 'devotee@example.com',
        emailConfirmedAt: null,
      },
      isLoading: false,
    })
  })

  it('signs out and redirects to /login on logout', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.()
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(mutateMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })
})
