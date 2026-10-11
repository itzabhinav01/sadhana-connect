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

  it('renders summary statistics and book titles', async () => {
    const { getByText } = await render(
      <PrabhupadaBooksTrackerSection profileId="u1" />,
    )

    expect(getByText('Prabhupada Books Reading')).toBeTruthy()
    expect(getByText('33%')).toBeTruthy()
    expect(getByText('1 Done')).toBeTruthy()
    expect(getByText('1 Reading')).toBeTruthy()
    expect(getByText('1 To Read')).toBeTruthy()
    expect(getByText('On The Way to Krishna')).toBeTruthy()
    expect(getByText('Elevation to Krishna Consciousness')).toBeTruthy()
  })

  it('allows updating book status when editable is true', async () => {
    const { getAllByText } = await render(
      <PrabhupadaBooksTrackerSection profileId="u1" editable={true} />,
    )

    const readingButtons = getAllByText('Reading')
    fireEvent.press(readingButtons[0]!)

    expect(mockMutate).toHaveBeenCalledWith({
      bookId: 1,
      status: 'reading',
    })
  })
})
