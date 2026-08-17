import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountDisabledPage } from '@/presentation/pages/AccountDisabledPage'

const { mutateMock, navigateMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('@/application/auth/use-sign-out', () => ({
  useSignOut: () => ({ mutate: mutateMock, isPending: false }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

describe('AccountDisabledPage', () => {
  beforeEach(() => {
    mutateMock.mockReset()
    navigateMock.mockReset()
  })

  it('shows the disabled-account message', () => {
    render(
      <MemoryRouter>
        <AccountDisabledPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/account disabled/i)).toBeInTheDocument()
  })

  it('signs out and redirects to /login on logout', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.()
    })

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AccountDisabledPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(mutateMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })
})
