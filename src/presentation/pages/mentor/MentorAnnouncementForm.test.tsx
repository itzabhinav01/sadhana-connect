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

  it('never renders any scope selector', () => {
    useCreateMentorAnnouncementMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })

    render(<MentorAnnouncementForm />)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByText(/scope/i)).not.toBeInTheDocument()
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
      { title: 'Temple Closure Notice', content: 'The temple will be closed Monday.', isPublished: true },
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
      { title: 'Draft Notice', content: 'Still working on this.', isPublished: false },
      expect.anything(),
    )
  })
})
