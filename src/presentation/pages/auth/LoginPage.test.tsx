import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/presentation/pages/auth/LoginPage'

vi.mock('@sadhana-connect/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/auth')>()
  return {
    ...actual,
    useSignIn: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    }),
  }
})

describe('LoginPage', () => {
  it('does not link to the password-reset entry point while email recovery is disabled', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('link', { name: /forgot your password/i }),
    ).not.toBeInTheDocument()
  })

  it('shows the deferred password-recovery message instead', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/password recovery by email will be available soon/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/contact your administrator/i),
    ).toBeInTheDocument()
  })
})
