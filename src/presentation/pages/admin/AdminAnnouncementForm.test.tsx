import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminAnnouncementForm } from '@/presentation/pages/admin/AdminAnnouncementForm'

const { useCreateAdminAnnouncementMock, useAdminTempleGroupsMock } = vi.hoisted(() => ({
  useCreateAdminAnnouncementMock: vi.fn(),
  useAdminTempleGroupsMock: vi.fn(),
}))

vi.mock('@/application/admin/use-create-admin-announcement', () => ({
  useCreateAdminAnnouncement: useCreateAdminAnnouncementMock,
}))
vi.mock('@/application/admin/use-admin-temple-groups', () => ({
  useAdminTempleGroups: useAdminTempleGroupsMock,
}))

describe('AdminAnnouncementForm', () => {
  beforeEach(() => {
    useCreateAdminAnnouncementMock.mockReset()
    useAdminTempleGroupsMock.mockReset()
    useAdminTempleGroupsMock.mockReturnValue({ data: [{ id: 'group-1', name: 'Main Temple' }] })
  })

  it('submits with scope "all" and expiresAt: null by default', async () => {
    const mutate = vi.fn()
    useCreateAdminAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<AdminAnnouncementForm />)
    await user.type(screen.getByLabelText('Title'), 'Platform Notice')
    await user.type(screen.getByLabelText('Content'), 'Applies to everyone.')
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).toHaveBeenCalledWith(
      {
        title: 'Platform Notice',
        content: 'Applies to everyone.',
        scope: 'all',
        templeGroupId: null,
        isPublished: true,
        expiresAt: null,
      },
      expect.anything(),
    )
  })

  it('requires a temple group when scope is "A specific temple group"', async () => {
    const mutate = vi.fn()
    useCreateAdminAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<AdminAnnouncementForm />)
    await user.type(screen.getByLabelText('Title'), 'Group Notice')
    await user.type(screen.getByLabelText('Content'), 'Body.')
    await user.selectOptions(screen.getByLabelText('Audience'), 'A specific temple group')
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText('Select a temple group for this scope.')).toBeInTheDocument()
  })

  it('selecting a "3 days" expiration resolves to a future ISO date roughly 3 days out', async () => {
    const mutate = vi.fn()
    useCreateAdminAnnouncementMock.mockReturnValue({ mutate, isPending: false, isError: false })
    const user = userEvent.setup()

    render(<AdminAnnouncementForm />)
    await user.type(screen.getByLabelText('Title'), 'Short Notice')
    await user.type(screen.getByLabelText('Content'), 'Expires soon.')
    await user.selectOptions(screen.getByLabelText('Expiration'), '3d')
    await user.click(screen.getByRole('button', { name: /post announcement/i }))

    expect(mutate).toHaveBeenCalledTimes(1)
    const [payload] = mutate.mock.calls[0] as [{ expiresAt: string | null }]
    expect(payload.expiresAt).not.toBeNull()
    const daysOut = (new Date(payload.expiresAt as string).getTime() - Date.now()) / 86_400_000
    expect(daysOut).toBeGreaterThan(2.9)
    expect(daysOut).toBeLessThan(3.1)
  })
})
