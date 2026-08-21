import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MentorAnnouncementForm } from '@/presentation/pages/mentor/MentorAnnouncementForm'

const { useCreateMentorAnnouncementMock } = vi.hoisted(() => ({
  useCreateMentorAnnouncementMock: vi.fn(),
}))

vi.mock('@/application/announcements/use-create-announcement', () => ({
  useCreateMentorAnnouncement: useCreateMentorAnnouncementMock,
}))

describe('MentorAnnouncementForm', () => {
  beforeEach(() => {
    useCreateMentorAnnouncementMock.mockReset()
  })

  it('never renders any scope/audience selector (the Expiration select is not a scope choice)', () => {
    useCreateMentorAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })

    render(<MentorAnnouncementForm />)

    expect(screen.queryByLabelText(/audience/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/scope/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Expiration')).toBeInTheDocument()
  })

  it('rejects an empty title/content without calling the mutation', async () => {
    const mutate = vi.fn()
    useCreateMentorAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorAnnouncementForm />)
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText('Title is required.')).toBeInTheDocument()
  })

  it('submits with isPublished: true by default (Publish immediately checked)', async () => {
    const mutate = vi.fn()
    useCreateMentorAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorAnnouncementForm />)
    await user.type(screen.getByLabelText('Title'), 'Temple Closure Notice')
    await user.type(screen.getByLabelText('Content'), 'The temple will be closed Monday.')
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).toHaveBeenCalledWith(
      {
        title: 'Temple Closure Notice',
        content: 'The temple will be closed Monday.',
        isPublished: true,
        expiresAt: null,
      },
      expect.anything(),
    )
  })

  it('unchecking "Publish immediately" submits isPublished: false', async () => {
    const mutate = vi.fn()
    useCreateMentorAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorAnnouncementForm />)
    await user.type(screen.getByLabelText('Title'), 'Draft Notice')
    await user.type(screen.getByLabelText('Content'), 'Still working on this.')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).toHaveBeenCalledWith(
      { title: 'Draft Notice', content: 'Still working on this.', isPublished: false, expiresAt: null },
      expect.anything(),
    )
  })

  it('selecting a "7 days" expiration resolves to a future ISO date roughly 7 days out', async () => {
    const mutate = vi.fn()
    useCreateMentorAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorAnnouncementForm />)
    await user.type(screen.getByLabelText('Title'), 'Weekly Notice')
    await user.type(screen.getByLabelText('Content'), 'Expires in a week.')
    await user.selectOptions(screen.getByLabelText('Expiration'), '7d')
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).toHaveBeenCalledTimes(1)
    const [payload] = mutate.mock.calls[0] as [{ expiresAt: string | null }]
    expect(payload.expiresAt).not.toBeNull()
    const daysOut = (new Date(payload.expiresAt as string).getTime() - Date.now()) / 86_400_000
    expect(daysOut).toBeGreaterThan(6.9)
    expect(daysOut).toBeLessThan(7.1)
  })

  it('choosing "Custom date" without picking a date shows a validation error and does not submit', async () => {
    const mutate = vi.fn()
    useCreateMentorAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorAnnouncementForm />)
    await user.type(screen.getByLabelText('Title'), 'Custom Expiry Notice')
    await user.type(screen.getByLabelText('Content'), 'Body.')
    await user.selectOptions(screen.getByLabelText('Expiration'), 'custom')
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText('Choose an expiration date.')).toBeInTheDocument()
  })
})
