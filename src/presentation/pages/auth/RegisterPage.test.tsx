import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterPage } from '@/presentation/pages/auth/RegisterPage'

const { mutateMock, navigateMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('@/application/auth/use-sign-up', () => ({
  useSignUp: () => ({
    mutate: mutateMock,
    isPending: false,
    isError: false,
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/full name/i), 'Test Devotee')
  await user.type(screen.getByLabelText(/^email$/i), 'devotee@example.com')
  await user.type(screen.getByLabelText(/phone number/i), '+919876543210')
  await user.type(screen.getByLabelText(/^password$/i), 'password123')
  await user.type(screen.getByLabelText(/confirm password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /create account/i }))
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mutateMock.mockReset()
    navigateMock.mockReset()
  })

  it('navigates to / when signUp succeeds with a session', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.({
        session: {
          userId: '1',
          email: 'devotee@example.com',
          emailConfirmedAt: null,
        },
      })
    })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    await fillAndSubmit()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('does not navigate to /check-email on success', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.({
        session: {
          userId: '1',
          email: 'devotee@example.com',
          emailConfirmedAt: null,
        },
      })
    })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    await fillAndSubmit()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled()
    })
    expect(navigateMock).not.toHaveBeenCalledWith(
      '/check-email',
      expect.anything(),
    )
  })

  it('shows an inline message and does not navigate when signUp succeeds without a session', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.({ session: null })
    })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    await fillAndSubmit()

    expect(
      await screen.findByText(/couldn't complete your registration/i),
    ).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
