import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VerseOfTheDayPage } from '@/presentation/pages/verse/VerseOfTheDayPage'

const { useVerseOfTheDayMock } = vi.hoisted(() => ({
  useVerseOfTheDayMock: vi.fn(),
}))

vi.mock('@/application/verse/use-verse-of-the-day', () => ({
  useVerseOfTheDay: useVerseOfTheDayMock,
}))

describe('VerseOfTheDayPage', () => {
  beforeEach(() => {
    useVerseOfTheDayMock.mockReset()
  })

  it('shows a loading state while the query is pending', () => {
    useVerseOfTheDayMock.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    render(<VerseOfTheDayPage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state when the query fails', () => {
    useVerseOfTheDayMock.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    render(<VerseOfTheDayPage />)

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows an honest empty state when no verse is available, never a fabricated one', () => {
    useVerseOfTheDayMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: null,
    })

    render(<VerseOfTheDayPage />)

    expect(
      screen.getByText("Today's verse is not available yet."),
    ).toBeInTheDocument()
  })

  it('renders the citation card once a verse resolves', () => {
    useVerseOfTheDayMock.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'v1',
        chapter: 2,
        verseNumber: '47',
        sourceUrl: 'https://vedabase.io/en/library/bg/2/47/',
        orderIndex: 0,
        scheduledDate: null,
      },
    })

    render(<VerseOfTheDayPage />)

    expect(
      screen.getByRole('heading', { name: 'Bhagavad-gītā As It Is 2.47' }),
    ).toBeInTheDocument()
  })
})
