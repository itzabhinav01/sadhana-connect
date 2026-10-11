import { fireEvent, render } from '@testing-library/react-native'

import { PrabhupadaBooksDashboardCard } from './PrabhupadaBooksDashboardCard'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

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
      summary: {
        total: 36,
        completed: 12,
        reading: 4,
        notStarted: 20,
        completionPercentage: 33,
      },
    },
    isLoading: false,
  })),
}))

describe('PrabhupadaBooksDashboardCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders summary progress and completion percentage', async () => {
    const { getByText } = await render(<PrabhupadaBooksDashboardCard />)

    expect(getByText('Prabhupada Books')).toBeTruthy()
    expect(getByText('33%')).toBeTruthy()
    expect(getByText('12 Done')).toBeTruthy()
    expect(getByText('4 Reading')).toBeTruthy()
    expect(getByText('20 To Read')).toBeTruthy()
  })

  it('navigates to profile on pressing update button', async () => {
    const { getByText } = await render(<PrabhupadaBooksDashboardCard />)

    const button = getByText('Update Reading Progress')
    fireEvent.press(button)

    expect(mockPush).toHaveBeenCalledWith('/devotee/profile')
  })
})
