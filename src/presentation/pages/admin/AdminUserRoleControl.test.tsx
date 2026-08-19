import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdminUser } from '@/domain/entities/admin-user'
import { AdminUserRoleControl } from '@/presentation/pages/admin/AdminUserRoleControl'

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
  anonymizedAt: null,
  templeGroupId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mentor: AdminUser = { ...devotee, id: 'mentor-1', fullName: 'Mentor One', role: 'mentor' }

describe('AdminUserRoleControl', () => {
  beforeEach(() => {
    useMentorDevoteeCountMock.mockReset()
    useChangeUserRoleMock.mockReset()
    useChangeUserRoleMock.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false })
  })

  it('never offers super_admin as a selectable role', () => {
    useMentorDevoteeCountMock.mockReturnValue({ data: 0 })
    render(<AdminUserRoleControl user={devotee} />)

    const select = screen.getByLabelText('Change role')
    const options = within(select).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Devotee', 'Mentor'])
    expect(screen.queryByText(/super admin/i)).not.toBeInTheDocument()
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

    await user.selectOptions(screen.getByLabelText('Change role'), 'devotee')

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

    await user.selectOptions(screen.getByLabelText('Change role'), 'devotee')
    expect(screen.getByRole('button', { name: /save role/i })).not.toBeDisabled()

    await user.click(screen.getByRole('button', { name: /save role/i }))

    expect(mutate).toHaveBeenCalledWith(
      { userId: 'mentor-1', currentRole: 'mentor', newRole: 'devotee' },
      expect.anything(),
    )
  })
})
