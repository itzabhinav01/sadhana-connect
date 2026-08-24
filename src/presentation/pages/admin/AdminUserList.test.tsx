import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { AdminUser } from '@sadhana-connect/domain/entities/admin-user'
import { AdminUserList } from '@/presentation/pages/admin/AdminUserList'

const users: AdminUser[] = [
  {
    id: 'user-1',
    fullName: 'Devotee One',
    role: 'devotee',
    isActive: true,
    templeGroupId: null,
    phoneNumber: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

// Email must never appear in the main list — it is only ever fetched
// on-demand from the detail page (AdminUserEmailReveal). This list
// component doesn't import the email hook/repository at all.
describe('AdminUserList', () => {
  it('never renders an email address', () => {
    render(
      <MemoryRouter>
        <AdminUserList users={users} />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
    expect(screen.getByText('Devotee One')).toBeInTheDocument()
  })
})
