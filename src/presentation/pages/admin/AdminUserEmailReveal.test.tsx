import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminUserEmailReveal } from '@/presentation/pages/admin/AdminUserEmailReveal'

const { useRevealUserEmailMock } = vi.hoisted(() => ({ useRevealUserEmailMock: vi.fn() }))

vi.mock('@/application/admin/use-admin-user-email', () => ({
  useRevealUserEmail: useRevealUserEmailMock,
}))

// Email must only ever be fetched on an explicit admin action, never as a
// side effect of opening the detail page — nothing here fires on mount.
describe('AdminUserEmailReveal', () => {
  beforeEach(() => {
    useRevealUserEmailMock.mockReset()
  })

  it('does not fetch on mount — shows a Reveal button, not the email, until clicked', () => {
    const mutate = vi.fn()
    useRevealUserEmailMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      mutate,
    })

    render(<AdminUserEmailReveal targetUserId="user-1" />)

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /reveal email/i })).toBeInTheDocument()
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })

  it('fetches only when the Reveal button is explicitly clicked, passing the target id', async () => {
    const mutate = vi.fn()
    useRevealUserEmailMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      mutate,
    })
    const user = userEvent.setup()

    render(<AdminUserEmailReveal targetUserId="user-1" />)
    await user.click(screen.getByRole('button', { name: /reveal email/i }))

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith('user-1')
  })

  it('renders the email once loaded, replacing the button', () => {
    useRevealUserEmailMock.mockReturnValue({
      data: 'devotee@example.com',
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
    })

    render(<AdminUserEmailReveal targetUserId="user-1" />)

    expect(screen.getByText('devotee@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reveal email/i })).not.toBeInTheDocument()
  })

  it('visibly renders "Could not load email." on failure, without exposing the underlying error', () => {
    useRevealUserEmailMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error('Edge Function returned a non-2xx status code: 403 Forbidden — Not authorized.'),
      mutate: vi.fn(),
    })

    render(<AdminUserEmailReveal targetUserId="user-1" />)

    expect(screen.getByText('Could not load email.')).toBeInTheDocument()
    expect(screen.queryByText(/403|Forbidden|non-2xx|status code/i)).not.toBeInTheDocument()
    // The Reveal button remains so the admin can retry.
    expect(screen.getByRole('button', { name: /reveal email/i })).toBeInTheDocument()
  })
})
