import { fireEvent, render } from '@testing-library/react-native'

import { PrabhupadaBooksTrackerSection } from './PrabhupadaBooksTrackerSection'

const mockMutate = jest.fn()

jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('@sadhana-connect/books', () => ({
  PRABHUPADA_BOOKS_LIST: [],
  useDevoteeBookProgress: jest.fn(() => ({
    data: {
      booksWithProgress: [
        {
          id: 1,
          sequenceNumber: 1,
          title: 'On The Way to Krishna',
          readingUrl: 'https://vedabase.io/en/library/owk/',
          status: 'completed',
          completedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          sequenceNumber: 2,
          title: 'Elevation to Krishna Consciousness',
          readingUrl: 'https://prabhupadabooks.com/etkc',
          status: 'reading',
          completedAt: null,
        },
        {
          id: 3,
          sequenceNumber: 3,
          title: 'Perfection of Yoga',
          readingUrl: null,
          status: 'not_started',
          completedAt: null,
        },
      ],
      summary: {
        total: 3,
        completed: 1,
        reading: 1,
        notStarted: 1,
        completionPercentage: 33,
      },
    },
    isLoading: false,
  })),
  useUpdateBookProgress: jest.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}))

describe('PrabhupadaBooksTrackerSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders summary statistics and is collapsed by default', async () => {
    const { getByText, queryByText } = await render(
      <PrabhupadaBooksTrackerSection profileId="u1" />,
    )

    expect(getByText('Prabhupada Books Reading')).toBeTruthy()
    expect(getByText('33%')).toBeTruthy()
    expect(getByText('1 Done')).toBeTruthy()
    expect(getByText('1 Reading')).toBeTruthy()
    expect(getByText('1 To Read')).toBeTruthy()
    expect(getByText(/Show Books/)).toBeTruthy()

    // Collapsed by default — book list is hidden until expanded
    expect(queryByText('On The Way to Krishna')).toBeNull()
  })

  it('expands to reveal books and allows updating book status when editable is true', async () => {
    const { getByText, getAllByText } = await render(
      <PrabhupadaBooksTrackerSection profileId="u1" editable={true} defaultExpanded={true} />,
    )

    expect(getByText('On The Way to Krishna')).toBeTruthy()
    expect(getByText('Elevation to Krishna Consciousness')).toBeTruthy()

    const readingButtons = getAllByText('Reading')
    fireEvent.press(readingButtons[0]!)

    expect(mockMutate).toHaveBeenCalledWith({
      bookId: 1,
      status: 'reading',
      profileId: 'u1',
    })
  })

  it('toggles expand and collapse when pressing toggle buttons', async () => {
    const { getByText, queryByText, getByRole } = await render(
      <PrabhupadaBooksTrackerSection profileId="u1" />,
    )

    expect(queryByText('On The Way to Krishna')).toBeNull()

    // Expand
    await fireEvent.press(getByRole('button', { name: 'Show all 3 books' }))
    expect(getByText('On The Way to Krishna')).toBeTruthy()
    expect(getByRole('button', { name: 'Hide books' })).toBeTruthy()

    // Collapse
    await fireEvent.press(getByRole('button', { name: 'Hide books' }))
    expect(queryByText('On The Way to Krishna')).toBeNull()
  })
})
