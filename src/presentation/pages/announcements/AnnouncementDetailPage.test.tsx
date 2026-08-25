import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementDetailPage } from '@/presentation/pages/announcements/AnnouncementDetailPage'

const { useAnnouncementsMock } = vi.hoisted(() => ({
  useAnnouncementsMock: vi.fn(),
}))

vi.mock('@sadhana-connect/announcements', () => ({
  useAnnouncements: useAnnouncementsMock,
}))
// Comments have their own dedicated test coverage
// (AnnouncementComments.test.tsx) — stubbed here so this file stays
// focused on AnnouncementDetailPage's own loading/error/not-available/
// found states.
vi.mock('@/presentation/pages/announcements/AnnouncementComments', () => ({
  AnnouncementComments: () => <div data-testid="announcement-comments-stub" />,
}))

function renderAtId(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/announcements/${id}`]}>
      <Routes>
        <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AnnouncementDetailPage', () => {
  beforeEach(() => {
    useAnnouncementsMock.mockReset()
  })

  it('shows a loading state', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    renderAtId('a1')

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    renderAtId('a1')

    expect(
      screen.getByText(/something went wrong loading this announcement/i),
    ).toBeInTheDocument()
  })

  it('shows a generic not-available message when the id does not match any visible announcement', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [{ id: 'other-id', title: 'Other', content: 'Other content' }],
    })

    renderAtId('a1')

    expect(
      screen.getByText('This announcement is no longer available.'),
    ).toBeInTheDocument()
  })

  it('renders the title, content, and comment section when the announcement is visible to this viewer', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'a1',
          authorId: 'mentor-1',
          title: 'Temple Closure',
          content: 'The temple will be closed for cleaning on Monday.',
        },
      ],
    })

    renderAtId('a1')

    expect(
      screen.getByRole('heading', { name: 'Temple Closure' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('The temple will be closed for cleaning on Monday.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('announcement-comments-stub')).toBeInTheDocument()
  })
})
