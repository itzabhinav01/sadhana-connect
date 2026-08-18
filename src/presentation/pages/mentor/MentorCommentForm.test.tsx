import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COMMENT_MAX_LENGTH } from '@/application/comments/comment-schema'
import { MentorCommentForm } from '@/presentation/pages/mentor/MentorCommentForm'

const { useAddCommentMock } = vi.hoisted(() => ({ useAddCommentMock: vi.fn() }))

vi.mock('@/application/comments/use-add-comment', () => ({
  useAddComment: useAddCommentMock,
}))

describe('MentorCommentForm', () => {
  beforeEach(() => {
    useAddCommentMock.mockReset()
  })

  it('rejects an empty comment without calling the mutation', async () => {
    const mutate = vi.fn()
    useAddCommentMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorCommentForm sadhanaReportId="r1" />)
    await user.click(screen.getByRole('button', { name: /post comment/i }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument()
  })

  it('rejects a comment over the max length without calling the mutation', async () => {
    const mutate = vi.fn()
    useAddCommentMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorCommentForm sadhanaReportId="r1" />)
    const textarea = screen.getByLabelText('Add a comment')
    // The textarea's native maxLength already prevents typing/pasting
    // past the limit through normal interaction — fireEvent.change sets
    // the DOM value directly to exercise the Zod validation itself as a
    // defense-in-depth check, independent of that native behavior.
    fireEvent.change(textarea, {
      target: { value: 'a'.repeat(COMMENT_MAX_LENGTH + 1) },
    })
    await user.click(screen.getByRole('button', { name: /post comment/i }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText(/2000 characters or fewer/i)).toBeInTheDocument()
  })

  it('submits a valid comment and clears the field on success', async () => {
    const mutate = vi.fn((_text, options) => options?.onSuccess?.())
    useAddCommentMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<MentorCommentForm sadhanaReportId="r1" />)
    const textarea = screen.getByLabelText('Add a comment')
    await user.type(textarea, 'Great progress this week!')
    await user.click(screen.getByRole('button', { name: /post comment/i }))

    expect(mutate).toHaveBeenCalledWith('Great progress this week!', expect.anything())
    expect(textarea).toHaveValue('')
  })

  it('shows a posting error message when the mutation fails', () => {
    useAddCommentMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: true })

    render(<MentorCommentForm sadhanaReportId="r1" />)

    expect(screen.getByText(/something went wrong posting/i)).toBeInTheDocument()
  })
})
