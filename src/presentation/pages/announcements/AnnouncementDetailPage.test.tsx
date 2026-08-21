import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementDetailPage } from '@/presentation/pages/announcements/AnnouncementDetailPage'

const { useAnnouncementsMock } = vi.hoisted(() => ({
  useAnnouncementsMock: vi.fn(),
}))

vi.mock('@/application/announcements/use-announcements', () => ({
  useAnnouncements: useAnnouncementsMock,
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

  it('shows a not-available message when the id does not match any visible announcement', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [{ id: 'other-id', title: 'Other', content: 'Other content' }],
    })

    renderAtId('a1')

    expect(
      screen.getByText('This announcement is not available.'),
    ).toBeInTheDocument()
  })

  it('renders the title and content when the announcement is visible to this viewer', () => {
    useAnnouncementsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'a1',
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
  })
})
