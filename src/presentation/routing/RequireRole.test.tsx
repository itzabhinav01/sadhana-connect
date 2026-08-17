import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { AppRole } from '@/domain/entities/profile'
import { RequireRole } from '@/presentation/routing/RequireRole'

const { useProfileMock } = vi.hoisted(() => ({ useProfileMock: vi.fn() }))

vi.mock('@/application/profile/use-profile', () => ({
  useProfile: useProfileMock,
}))

function renderGuard(allow: AppRole[], initialPath = '/mentor') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route element={<RequireRole allow={allow} />}>
          <Route path="/mentor" element={<div>Mentor content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  it('renders the nested route when the role is allowed', () => {
    useProfileMock.mockReturnValue({
      data: {
        id: '1',
        fullName: 'M',
        role: 'mentor',
        templeGroupId: null,
        isActive: true,
      },
    })
    renderGuard(['mentor'])
    expect(screen.getByText('Mentor content')).toBeInTheDocument()
  })

  it('redirects to / when the role is not in the allow-list', () => {
    useProfileMock.mockReturnValue({
      data: {
        id: '1',
        fullName: 'D',
        role: 'devotee',
        templeGroupId: null,
        isActive: true,
      },
    })
    renderGuard(['mentor'])
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('redirects to / when the profile has not loaded yet', () => {
    useProfileMock.mockReturnValue({ data: undefined })
    renderGuard(['mentor'])
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })
})
