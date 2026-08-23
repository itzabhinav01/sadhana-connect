import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MentorCapReachedError } from '@/application/admin/use-assign-mentor'
import { AdminAssignmentForm } from '@/presentation/pages/admin/AdminAssignmentForm'

// Radix's Select renders its popup in a portal with no native <select>
// underneath, so userEvent.selectOptions doesn't apply — open the
// trigger, then click the option by its visible text.
async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionName: string,
) {
  await user.click(trigger)
  await user.click(await screen.findByRole('option', { name: optionName }))
}

const { useAdminUsersMock, useAssignMentorMock, mutateMock } = vi.hoisted(() => ({
  useAdminUsersMock: vi.fn(),
  useAssignMentorMock: vi.fn(),
  mutateMock: vi.fn(),
}))

vi.mock('@/application/admin/use-admin-users', () => ({
  useAdminUsers: useAdminUsersMock,
}))
vi.mock('@/application/admin/use-assign-mentor', async () => {
  const actual = await vi.importActual<typeof import('@/application/admin/use-assign-mentor')>(
    '@/application/admin/use-assign-mentor',
  )
  return { ...actual, useAssignMentor: useAssignMentorMock }
})

const devoteesPage = {
  pages: [{ users: [{ id: 'devotee-1', fullName: 'Test Devotee' }] }],
}
const mentorsPage = {
  pages: [{ users: [{ id: 'mentor-1', fullName: 'Test Mentor' }] }],
}

describe('AdminAssignmentForm', () => {
  beforeEach(() => {
    useAdminUsersMock.mockReset()
    useAssignMentorMock.mockReset()
    mutateMock.mockReset()

    useAdminUsersMock.mockImplementation(({ role }: { role: string }) =>
      role === 'devotee' ? { data: devoteesPage } : { data: mentorsPage },
    )
    useAssignMentorMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: false,
      isSuccess: false,
    })
  })

  it('assigns the selected mentor to the selected devotee', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.()
    })
    const user = userEvent.setup()

    render(<AdminAssignmentForm />)

    await selectOption(user, screen.getByRole('combobox', { name: 'Devotee' }), 'Test Devotee')
    await selectOption(user, screen.getByRole('combobox', { name: 'Mentor' }), 'Test Mentor')
    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    expect(mutateMock).toHaveBeenCalledWith(
      { devoteeId: 'devotee-1', mentorId: 'mentor-1' },
      expect.anything(),
    )
  })

  it('shows the friendly cap message instead of a generic error when the mentor cap is reached', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onError?.(new MentorCapReachedError())
    })
    const user = userEvent.setup()

    render(<AdminAssignmentForm />)

    await selectOption(user, screen.getByRole('combobox', { name: 'Devotee' }), 'Test Devotee')
    await selectOption(user, screen.getByRole('combobox', { name: 'Mentor' }), 'Test Mentor')
    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() =>
      expect(
        screen.getByText(/already has the maximum of 3 active mentors/i),
      ).toBeInTheDocument(),
    )
    expect(
      screen.queryByText(/something went wrong saving this assignment/i),
    ).not.toBeInTheDocument()
  })

  it('shows a generic error for a non-cap failure', async () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onError?.(new Error('mentor_id must be an active profile'))
    })
    useAssignMentorMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isError: true,
      isSuccess: false,
    })
    const user = userEvent.setup()

    render(<AdminAssignmentForm />)

    await selectOption(user, screen.getByRole('combobox', { name: 'Devotee' }), 'Test Devotee')
    await selectOption(user, screen.getByRole('combobox', { name: 'Mentor' }), 'Test Mentor')
    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    expect(
      screen.getByText(/something went wrong saving this assignment/i),
    ).toBeInTheDocument()
  })
})
