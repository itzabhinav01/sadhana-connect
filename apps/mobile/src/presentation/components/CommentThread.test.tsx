jest.mock('../../application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../../packages/comments/src/use-sadhana-report-comments', () => ({
  useSadhanaReportComments: jest.fn(),
}))

jest.mock('../../../../../packages/comments/src/use-add-comment', () => ({
  useAddComment: jest.fn(),
}))

jest.mock('../../../../../packages/comments/src/use-update-comment', () => ({
  useUpdateComment: jest.fn(),
}))

jest.mock('../../../../../packages/comments/src/use-delete-comment', () => ({
  useDeleteComment: jest.fn(),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useAuth } from '@sadhana-connect/auth'
import {
  useAddComment,
  useDeleteComment,
  useSadhanaReportComments,
  useUpdateComment,
} from '@sadhana-connect/comments'

import { CommentThread } from './CommentThread'

const mockUseAuth = useAuth as jest.Mock
const mockUseSadhanaReportComments = useSadhanaReportComments as jest.Mock
const mockUseAddComment = useAddComment as jest.Mock
const mockUseUpdateComment = useUpdateComment as jest.Mock
const mockUseDeleteComment = useDeleteComment as jest.Mock
const mockAddMutate = jest.fn()
const mockUpdateMutate = jest.fn()
const mockDeleteMutate = jest.fn()

const ownComment = {
  id: 'c1',
  sadhanaReportId: 'r1',
  mentorId: 'mentor-1',
  mentorName: 'Mentor One',
  commentText: 'Great progress!',
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
}

const otherMentorComment = {
  id: 'c2',
  sadhanaReportId: 'r1',
  mentorId: 'mentor-2',
  mentorName: 'Former Mentor',
  commentText: 'Keep it up.',
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
}

describe('CommentThread', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseAuth.mockReset()
    mockUseSadhanaReportComments.mockReset()
    mockUseAddComment.mockReset()
    mockUseUpdateComment.mockReset()
    mockUseDeleteComment.mockReset()
    mockAddMutate.mockReset()
    mockUpdateMutate.mockReset()
    mockDeleteMutate.mockReset()
    mockUseAuth.mockReturnValue({
      session: { userId: 'mentor-1', email: 'm@b.com', emailConfirmedAt: null },
      isLoading: false,
    })
    mockUseAddComment.mockReturnValue({ mutate: mockAddMutate, isPending: false, isError: false })
    mockUseUpdateComment.mockReturnValue({ mutate: mockUpdateMutate, isPending: false })
    mockUseDeleteComment.mockReturnValue({ mutate: mockDeleteMutate, isPending: false })
  })

  it('shows a loading state while comments are pending', async () => {
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    const { getByText } = await render(<CommentThread sadhanaReportId="r1" />)
    expect(getByText('Loading comments…')).toBeTruthy()
  })

  it('shows an error state on failure', async () => {
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    const { getByText } = await render(<CommentThread sadhanaReportId="r1" />)
    expect(getByText(/something went wrong loading comments/i)).toBeTruthy()
  })

  it('shows an empty state when there are no comments', async () => {
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    const { getByText } = await render(<CommentThread sadhanaReportId="r1" />)
    expect(getByText('No comments yet.')).toBeTruthy()
  })

  it('renders each comment and shows Edit/Delete only for the own comment', async () => {
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownComment, otherMentorComment],
    })

    const { getByText, getAllByRole } = await render(<CommentThread sadhanaReportId="r1" />)
    expect(getByText('Mentor One')).toBeTruthy()
    expect(getByText('Great progress!')).toBeTruthy()
    expect(getByText('Former Mentor')).toBeTruthy()
    expect(getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    expect(getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('requires delete confirmation before calling the mutation', async () => {
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownComment],
    })

    const { getByRole, getByText } = await render(<CommentThread sadhanaReportId="r1" />)

    await fireEvent.press(getByRole('button', { name: 'Delete' }))
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    expect(getByText('Delete this comment?')).toBeTruthy()

    await fireEvent.press(getByRole('button', { name: 'Confirm' }))
    expect(mockDeleteMutate).toHaveBeenCalledWith('c1')
  })

  it('edit switches to a textbox and saves the validated text', async () => {
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [ownComment],
    })

    const { getByRole, getByLabelText } = await render(<CommentThread sadhanaReportId="r1" />)

    await fireEvent.press(getByRole('button', { name: 'Edit' }))
    const textbox = getByLabelText('Edit comment')
    await fireEvent.changeText(textbox, 'Updated note')
    await fireEvent.press(getByRole('button', { name: 'Save' }))

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { commentId: 'c1', commentText: 'Updated note' },
      expect.anything(),
    )
  })

  it('rejects an empty comment without calling the mutation', async () => {
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    const { getByRole, getByText } = await render(<CommentThread sadhanaReportId="r1" />)

    await fireEvent.press(getByRole('button', { name: 'Post Comment' }))

    expect(mockAddMutate).not.toHaveBeenCalled()
    expect(getByText(/cannot be empty/i)).toBeTruthy()
  })

  it('submits a valid comment and clears the field on success', async () => {
    mockAddMutate.mockImplementation((_text, options) => options?.onSuccess?.())
    mockUseSadhanaReportComments.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    const { getByRole, getByLabelText } = await render(<CommentThread sadhanaReportId="r1" />)

    const textbox = getByLabelText('Add a comment')
    await fireEvent.changeText(textbox, 'Great progress this week!')
    await fireEvent.press(getByRole('button', { name: 'Post Comment' }))

    expect(mockAddMutate).toHaveBeenCalledWith('Great progress this week!', expect.anything())
  })
})
