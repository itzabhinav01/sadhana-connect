jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/sadhana/src/use-sadhana-analytics', () => ({
  useSadhanaAnalytics: jest.fn(),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { getLastNDaysRange, useSadhanaAnalytics } from '@sadhana-connect/sadhana'

import AnalyticsScreen from './analytics'

const mockUseSadhanaAnalytics = useSadhanaAnalytics as jest.Mock

function makeSummary(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    fromDate: '2026-01-09',
    toDate: '2026-02-07',
    totalDays: 30,
    totalReports: 1,
    totalRounds: 16,
    averageRoundsPerSubmittedDay: 16,
    completionRate: 1 / 30,
    totalReadingMinutes: 15,
    averageReadingMinutesPerSubmittedDay: 45,
    totalHearingMinutes: 30,
    averageHearingMinutesPerSubmittedDay: 60,
    totalDayRestMinutes: 20,
    averageDayRestMinutesPerSubmittedDay: 50,
    totalRestMinutes: 420,
    averageTotalRestMinutesPerSubmittedDay: 480,
    roundsChartData: [],
    studyChartData: [],
    ...overrides,
  }
}

describe('AnalyticsScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseSadhanaAnalytics.mockReset()
    mockUseSadhanaAnalytics.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: makeSummary(),
    })
  })

  it('defaults to the last 30 days range', async () => {
    await render(<AnalyticsScreen />)

    const expected = getLastNDaysRange(30)
    expect(mockUseSadhanaAnalytics).toHaveBeenCalledWith(expected.fromDate, expected.toDate)
  })

  it('shows a loading state', async () => {
    mockUseSadhanaAnalytics.mockReturnValue({
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
    })

    const { getByText } = await render(<AnalyticsScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error state', async () => {
    mockUseSadhanaAnalytics.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
    })

    const { getByText } = await render(<AnalyticsScreen />)
    expect(getByText(/something went wrong loading your analytics/i)).toBeTruthy()
  })

  it('shows an empty state when there are zero reports', async () => {
    mockUseSadhanaAnalytics.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: makeSummary({ totalReports: 0 }),
    })

    const { getByText, queryByText } = await render(<AnalyticsScreen />)
    expect(getByText(/no sadhana reports found for this range/i)).toBeTruthy()
    expect(queryByText('Rounds')).toBeNull()
  })

  it('renders summary values from the data', async () => {
    const { getByText } = await render(<AnalyticsScreen />)

    expect(getByText('Rounds')).toBeTruthy()
    expect(getByText('16')).toBeTruthy()
    expect(getByText('16.0')).toBeTruthy()
    expect(getByText('Study')).toBeTruthy()
    expect(getByText('15 min')).toBeTruthy()
    expect(getByText('30 min')).toBeTruthy()
    expect(getByText('Rest')).toBeTruthy()
    expect(getByText('20 min')).toBeTruthy()
    expect(getByText('420 hr')).toBeTruthy()
  })

  it('switching to a preset re-queries with the computed dates', async () => {
    const { getByRole } = await render(<AnalyticsScreen />)

    await fireEvent.press(getByRole('button', { name: 'Last 90 days' }))

    const expected = getLastNDaysRange(90)
    expect(mockUseSadhanaAnalytics).toHaveBeenLastCalledWith(expected.fromDate, expected.toDate)
  })
})
