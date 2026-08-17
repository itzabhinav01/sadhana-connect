import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ForgotPasswordPage } from '@/presentation/pages/auth/ForgotPasswordPage'

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }))

vi.mock('@/application/auth/use-request-password-reset', () => ({
  useRequestPasswordReset: () => ({
    mutate: mutateMock,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}))

describe('ForgotPasswordPage', () => {
  it('shows the deferred password-recovery message instead of the reset form', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/password recovery by email will be available soon/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: /email/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /send reset link/i }),
    ).not.toBeInTheDocument()
  })

  it('never triggers a password-reset request while disabled', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('links back to sign in', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: /back to sign in/i }),
    ).toHaveAttribute('href', '/login')
  })
})
