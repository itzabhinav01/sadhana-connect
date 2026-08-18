import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MentorDevoteeDetailPage } from '@/presentation/pages/mentor/MentorDevoteeDetailPage'

const {
  useDevoteeProfileMock,
  useDevoteeTodayReportMock,
  useDevoteeRecentReportsMock,
  useDevoteeAssignedSinceMock,
} = vi.hoisted(() => ({
  useDevoteeProfileMock: vi.fn(),
  useDevoteeTodayReportMock: vi.fn(),
  useDevoteeRecentReportsMock: vi.fn(),
  useDevoteeAssignedSinceMock: vi.fn(),
}))

vi.mock('@/application/mentor/use-devotee-profile', () => ({
  useDevoteeProfile: useDevoteeProfileMock,
}))
vi.mock('@/application/mentor/use-devotee-today-report', () => ({
  useDevoteeTodayReport: useDevoteeTodayReportMock,
}))
vi.mock('@/application/mentor/use-devotee-recent-reports', () => ({
  useDevoteeRecentReports: useDevoteeRecentReportsMock,
}))
vi.mock('@/application/mentor/use-devotee-assigned-since', () => ({
  useDevoteeAssignedSince: useDevoteeAssignedSinceMock,
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/mentor/devotee/:id" element={<MentorDevoteeDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const idlePending = { isPending: true, isError: false, isSuccess: false, data: undefined }
const idleSuccessEmpty = { isPending: false, isError: false, isSuccess: true, data: null }
const idleSuccessList = { isPending: false, isError: false, isSuccess: true, data: [] }

describe('MentorDevoteeDetailPage', () => {
  beforeEach(() => {
    useDevoteeProfileMock.mockReset()
    useDevoteeTodayReportMock.mockReset()
    useDevoteeRecentReportsMock.mockReset()
    useDevoteeAssignedSinceMock.mockReset()
    useDevoteeTodayReportMock.mockReturnValue(idleSuccessEmpty)
    useDevoteeRecentReportsMock.mockReturnValue(idleSuccessList)
    useDevoteeAssignedSinceMock.mockReturnValue({ ...idleSuccessEmpty, data: null })
  })

  it('shows a loading state while the profile is pending', () => {
    useDevoteeProfileMock.mockReturnValue(idlePending)

    renderAt('/mentor/devotee/d1')

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state on a genuine query failure', () => {
    useDevoteeProfileMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    renderAt('/mentor/devotee/d1')

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows the generic "not available" state when the devotee is unassigned (RLS denies the profile)', () => {
    useDevoteeProfileMock.mockReturnValue(idleSuccessEmpty)

    renderAt('/mentor/devotee/unassigned-devotee')

    expect(
      screen.getByText("This devotee isn't available."),
    ).toBeInTheDocument()
  })

  it('shows the exact same "not available" state for a nonexistent devotee id — never distinguishing the two cases', () => {
    useDevoteeProfileMock.mockReturnValue(idleSuccessEmpty)

    renderAt('/mentor/devotee/does-not-exist')

    expect(
      screen.getByText("This devotee isn't available."),
    ).toBeInTheDocument()
    // No hint anywhere that this differs from the unauthorized case.
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not authorized/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/unauthorized/i)).not.toBeInTheDocument()
  })

  it('renders the devotee name, assignment date, and reports for an authorized devotee', () => {
    useDevoteeProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'd1',
        fullName: 'Devotee One',
        role: 'devotee',
        templeGroupId: null,
        isActive: true,
      },
    })
    useDevoteeAssignedSinceMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: '2025-01-01T00:00:00.000Z',
    })
    useDevoteeTodayReportMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })
    useDevoteeRecentReportsMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [],
    })

    renderAt('/mentor/devotee/d1')

    expect(screen.getByRole('heading', { name: 'Devotee One' })).toBeInTheDocument()
    expect(screen.getByText(/Assigned since/)).toBeInTheDocument()
    expect(screen.getByText('Not submitted yet today.')).toBeInTheDocument()
  })

  it('renders no editable form field, save button, or mutation control anywhere — mentors are read-only', () => {
    useDevoteeProfileMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'd1',
        fullName: 'Devotee One',
        role: 'devotee',
        templeGroupId: null,
        isActive: true,
      },
    })

    renderAt('/mentor/devotee/d1')

    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
