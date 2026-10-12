import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PrabhupadaBooksTracker } from './PrabhupadaBooksTracker'

const {
  useDevoteeBookProgressMock,
  useUpdateBookProgressMock,
  mutateMock,
} = vi.hoisted(() => ({
  useDevoteeBookProgressMock: vi.fn(),
  useUpdateBookProgressMock: vi.fn(),
  mutateMock: vi.fn(),
}))

vi.mock('@sadhana-connect/books', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sadhana-connect/books')>()
  return {
    ...actual,
    useDevoteeBookProgress: useDevoteeBookProgressMock,
    useUpdateBookProgress: useUpdateBookProgressMock,
  }
})

describe('PrabhupadaBooksTracker', () => {
  const mockBooks = [
    {
      id: 1,
      sequenceNumber: 1,
      title: 'On The Way to Krishna',
      readingUrl: 'https://vedabase.io/en/library/owk/',
      status: 'completed' as const,
      completedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      sequenceNumber: 2,
      title: 'Elevation to Krishna Consciousness',
      readingUrl: 'https://prabhupadabooks.com/etkc',
      status: 'reading' as const,
      completedAt: null,
    },
    {
      id: 3,
      sequenceNumber: 3,
      title: 'Krishna Consciousness the Matchless Gift',
      readingUrl: null,
      status: 'not_started' as const,
      completedAt: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useUpdateBookProgressMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    })
    useDevoteeBookProgressMock.mockReturnValue({
      data: {
        booksWithProgress: mockBooks,
        summary: {
          total: 3,
          completed: 1,
          reading: 1,
          notStarted: 1,
          completionPercentage: 33,
        },
      },
      isLoading: false,
    })
  })

  function renderTracker(props = {}) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <PrabhupadaBooksTracker profileId="user-1" {...props} />
      </QueryClientProvider>,
    )
  }

  it('renders tracker title, summary stats and book titles', () => {
    renderTracker()
    expect(screen.getByText('Prabhupada Books Reading Tracker')).toBeInTheDocument()
    expect(screen.getByText('33%')).toBeInTheDocument()
    expect(screen.getByText('1 Completed')).toBeInTheDocument()
    expect(screen.getByText('1 Reading')).toBeInTheDocument()
    expect(screen.getByText('1 To Read')).toBeInTheDocument()
    expect(screen.getByText('On The Way to Krishna')).toBeInTheDocument()
    expect(screen.getByText('Elevation to Krishna Consciousness')).toBeInTheDocument()
  })

  it('renders read online link for books with urls', () => {
    renderTracker()
    const readLinks = screen.getAllByRole('link', { name: /read online/i })
    expect(readLinks.length).toBe(2)
    expect(readLinks[0]).toHaveAttribute('href', 'https://vedabase.io/en/library/owk/')
  })

  it('allows changing status when editable is true', async () => {
    const user = userEvent.setup()
    renderTracker({ editable: true })

    const toReadButtons = screen.getAllByRole('button', { name: 'To Read' })
    await user.click(toReadButtons[0]!)

    expect(mutateMock).toHaveBeenCalledWith({
      bookId: 1,
      status: 'not_started',
    })
  })
})
