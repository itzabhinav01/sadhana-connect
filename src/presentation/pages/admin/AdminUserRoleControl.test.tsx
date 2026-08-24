import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdminUser } from '@sadhana-connect/domain/entities/admin-user'
import { AdminUserRoleControl } from '@/presentation/pages/admin/AdminUserRoleControl'

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

const { useMentorDevoteeCountMock, useChangeUserRoleMock } = vi.hoisted(() => ({
  useMentorDevoteeCountMock: vi.fn(),
  useChangeUserRoleMock: vi.fn(),
}))

vi.mock('@/application/admin/use-mentor-devotee-count', () => ({
  useMentorDevoteeCount: useMentorDevoteeCountMock,
}))
vi.mock('@/application/admin/use-change-user-role', async () => {
  const actual = await vi.importActual<
    typeof import('@/application/admin/use-change-user-role')
  >('@/application/admin/use-change-user-role')
  return { ...actual, useChangeUserRole: useChangeUserRoleMock }
})

const devotee: AdminUser = {
  id: 'devotee-1',
  fullName: 'Devotee One',
  role: 'devotee',
  isActive: true,
  templeGroupId: null,
  phoneNumber: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mentor: AdminUser = { ...devotee, id: 'mentor-1', fullName: 'Mentor One', role: 'mentor' }

describe('AdminUserRoleControl', () => {
  beforeEach(() => {
    useMentorDevoteeCountMock.mockReset()
    useChangeUserRoleMock.mockReset()
    useChangeUserRoleMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  })

  it('offers Devotee, Mentor, and Super Admin as selectable roles', async () => {
    useMentorDevoteeCountMock.mockReturnValue({ data: 0 })
    const user = userEvent.setup()
    render(<AdminUserRoleControl user={devotee} />)

    await user.click(screen.getByLabelText('Change role'))
    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Devotee', 'Mentor', 'Super Admin'])
  })

  it('promotes a devotee straight to Super Admin', async () => {
    useMentorDevoteeCountMock.mockReturnValue({ data: undefined })
    const mutate = vi.fn()
    useChangeUserRoleMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()
    render(<AdminUserRoleControl user={devotee} />)

    await selectOption(user, screen.getByLabelText('Change role'), 'Super Admin')
    await user.click(screen.getByRole('button', { name: /save role/i }))

    expect(mutate).toHaveBeenCalledWith(
      { userId: 'devotee-1', currentRole: 'devotee', newRole: 'super_admin' },
      expect.anything(),
    )
  })

  it('blocks promoting a mentor straight to Super Admin while they have active devotees (same guard as demoting to Devotee)', async () => {
    useMentorDevoteeCountMock.mockReturnValue({ data: 3 })
    const user = userEvent.setup()
    render(<AdminUserRoleControl user={mentor} />)

    await selectOption(user, screen.getByLabelText('Change role'), 'Super Admin')

    expect(
      screen.getByText(
        "This mentor still has active devotees. Reassign or deactivate all active devotees before changing the mentor's role.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save role/i })).toBeDisabled()
  })

  it('allows selecting Mentor for a devotee (promotion) with no active-assignment gate applied', () => {
    useMentorDevoteeCountMock.mockReturnValue({ data: undefined })
    render(<AdminUserRoleControl user={devotee} />)

    // useMentorDevoteeCount is only meaningfully consulted for a mentor
    // being demoted — for a devotee, the hook is called with a null
    // mentorId (disabled), so no active-assignment message can appear.
    expect(useMentorDevoteeCountMock).toHaveBeenCalledWith(null)
    expect(
      screen.queryByText(/still has active devotees/i),
    ).not.toBeInTheDocument()
  })

  it('disables saving and shows the required message when demoting a mentor with active devotees', async () => {
    useMentorDevoteeCountMock.mockReturnValue({ data: 3 })
    const user = userEvent.setup()
    render(<AdminUserRoleControl user={mentor} />)

    await selectOption(user, screen.getByLabelText('Change role'), 'Devotee')

    expect(
      screen.getByText(
        "This mentor still has active devotees. Reassign or deactivate all active devotees before changing the mentor's role.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save role/i })).toBeDisabled()
  })

  it('allows demoting a mentor with zero active devotees', async () => {
    useMentorDevoteeCountMock.mockReturnValue({ data: 0 })
    const mutate = vi.fn()
    useChangeUserRoleMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()
    render(<AdminUserRoleControl user={mentor} />)

    await selectOption(user, screen.getByLabelText('Change role'), 'Devotee')
    expect(screen.getByRole('button', { name: /save role/i })).not.toBeDisabled()

    await user.click(screen.getByRole('button', { name: /save role/i }))

    expect(mutate).toHaveBeenCalledWith(
      { userId: 'mentor-1', currentRole: 'mentor', newRole: 'devotee' },
      expect.anything(),
    )
  })
})
