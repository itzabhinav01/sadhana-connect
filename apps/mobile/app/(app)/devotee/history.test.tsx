jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/sadhana/src/use-sadhana-history', () => ({
  useSadhanaHistory: jest.fn(),
}))

jest.mock('../../../../../packages/auth/src/use-auth', () => ({
  useAuth: jest.fn(() => ({
    session: { userId: 'user-1', email: 'a@b.com', emailConfirmedAt: null },
    isLoading: false,
  })),
}))

jest.mock('../../../../../packages/infra-supabase/src/sadhana-report-repository', () => ({
  supabaseSadhanaReportRepository: { listReportsInRange: jest.fn() },
}))

const mockFetchQuery = jest.fn()

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => ({ fetchQuery: mockFetchQuery })),
}))

jest.mock('expo-router', () => {
  const { Text } = require('react-native')
  return {
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <Text>
        link:{href}:{children}
      </Text>
    ),
    useRouter: jest.fn(() => ({ push: jest.fn() })),
  }
})

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}))

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}))

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  writeAsStringAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8' },
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  buildSadhanaHistoryCsv,
  buildSadhanaHistoryHtml,
  buildSadhanaReportHtml,
  buildWhatsAppShareUrl,
  formatSadhanaReportForText,
  useSadhanaHistory,
} from '@sadhana-connect/sadhana'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'
import * as FileSystem from 'expo-file-system/legacy'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Linking, Share } from 'react-native'

import HistoryScreen from './history'

const mockUseSadhanaHistory = useSadhanaHistory as jest.Mock
const mockPrintToFileAsync = Print.printToFileAsync as jest.Mock
const mockShareAsync = Sharing.shareAsync as jest.Mock
const mockWriteAsStringAsync = FileSystem.writeAsStringAsync as jest.Mock

function page(reports: unknown[], nextCursor: string | null = null) {
  return { pages: [{ reports, nextCursor }] }
}

const fullReport = {
  id: 'r1',
  profileId: 'user-1',
  reportDate: '2026-08-20',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: '06:30',
  totalRounds: 16,
  readingMinutes: 10,
  bookName: null,
  hearingMinutes: 10,
  speakerName: null,
  sleepTime: '22:00',
  wakeTime: '04:00',
  dayRestMinutes: 0,
  totalRestMinutes: 0,
  officeGoingTime: null,
  officeReturnTime: null,
  notes: null,
  signatureText: 'Test Devotee',
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-20T00:00:00.000Z',
}

describe('HistoryScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockFetchQuery.mockReset()
    mockPrintToFileAsync.mockReset()
    mockShareAsync.mockReset()
    mockWriteAsStringAsync.mockReset()
  })

  it('shows the empty state with a link to fill sadhana when there are no reports', async () => {
    mockUseSadhanaHistory.mockReturnValue({
      isPending: false,
      isError: false,
      data: page([]),
      hasNextPage: false,
    })

    const { getByText } = await render(<HistoryScreen />)
    expect(getByText('No Sadhana reports found for this range.')).toBeTruthy()
    expect(getByText(/link:\/devotee\/sadhana:Fill Sadhana/)).toBeTruthy()
  })

  it('renders each report in the current page', async () => {
    mockUseSadhanaHistory.mockReturnValue({
      isPending: false,
      isError: false,
      data: page([
        { id: 'r1', reportDate: '2026-08-20', totalRounds: 16, readingMinutes: 10, hearingMinutes: 10 },
        { id: 'r2', reportDate: '2026-08-19', totalRounds: 20, readingMinutes: 15, hearingMinutes: 5 },
      ]),
      hasNextPage: false,
    })

    const { getByText } = await render(<HistoryScreen />)
    expect(getByText('2026-08-20')).toBeTruthy()
    expect(getByText('2026-08-19')).toBeTruthy()
  })

  it('shows a Load more button only when hasNextPage is true, and calls fetchNextPage', async () => {
    const fetchNextPage = jest.fn()
    mockUseSadhanaHistory.mockReturnValue({
      isPending: false,
      isError: false,
      data: page([{ id: 'r1', reportDate: '2026-08-20', totalRounds: 16, readingMinutes: 10, hearingMinutes: 10 }]),
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    })

    const { getByRole } = await render(<HistoryScreen />)
    await fireEvent.press(getByRole('button', { name: 'Load more' }))
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('opens the correctly formatted WhatsApp share URL for a report row', async () => {
    mockUseSadhanaHistory.mockReturnValue({
      isPending: false,
      isError: false,
      data: page([fullReport]),
      hasNextPage: false,
    })
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)

    const { getByRole } = await render(<HistoryScreen />)
    await fireEvent.press(
      getByRole('button', { name: `Share ${fullReport.reportDate} report to WhatsApp` }),
    )

    expect(openURLSpy).toHaveBeenCalledWith(buildWhatsAppShareUrl(fullReport))
  })

  it('shares the correctly formatted text export when "Export Text" is pressed', async () => {
    mockUseSadhanaHistory.mockReturnValue({
      isPending: false,
      isError: false,
      data: page([fullReport]),
      hasNextPage: false,
    })
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' })

    const { getByRole } = await render(<HistoryScreen />)
    await fireEvent.press(
      getByRole('button', { name: `Export ${fullReport.reportDate} report as text` }),
    )

    expect(shareSpy).toHaveBeenCalledWith({ message: formatSadhanaReportForText(fullReport) })
  })

  it('generates and shares a PDF when a report row\'s "Export PDF" is pressed', async () => {
    mockUseSadhanaHistory.mockReturnValue({
      isPending: false,
      isError: false,
      data: page([fullReport]),
      hasNextPage: false,
    })
    mockPrintToFileAsync.mockResolvedValue({ uri: 'file:///sadhana-report.pdf' })
    mockShareAsync.mockResolvedValue(undefined)

    const { getByRole } = await render(<HistoryScreen />)
    await fireEvent.press(
      getByRole('button', { name: `Export ${fullReport.reportDate} report as PDF` }),
    )

    expect(mockPrintToFileAsync).toHaveBeenCalledWith({ html: buildSadhanaReportHtml(fullReport) })
    expect(mockShareAsync).toHaveBeenCalledWith('file:///sadhana-report.pdf', {
      mimeType: 'application/pdf',
      dialogTitle: `Sadhana Report ${fullReport.reportDate}`,
    })
  })

  it('shows an error message when a report row\'s PDF export fails', async () => {
    mockUseSadhanaHistory.mockReturnValue({
      isPending: false,
      isError: false,
      data: page([fullReport]),
      hasNextPage: false,
    })
    mockPrintToFileAsync.mockRejectedValue(new Error('disk full'))

    const { getByRole, getByText } = await render(<HistoryScreen />)
    await fireEvent.press(
      getByRole('button', { name: `Export ${fullReport.reportDate} report as PDF` }),
    )

    expect(getByText('Something went wrong exporting this report. Please try again.')).toBeTruthy()
  })

  it('shows an error message when the query fails', async () => {
    mockUseSadhanaHistory.mockReturnValue({ isPending: false, isError: true, data: undefined, hasNextPage: false })

    const { getByText } = await render(<HistoryScreen />)
    expect(getByText('Something went wrong loading your history.')).toBeTruthy()
  })

  describe('bulk range export', () => {
    beforeEach(() => {
      mockUseSadhanaHistory.mockReturnValue({
        isPending: false,
        isError: false,
        data: page([fullReport]),
        hasNextPage: false,
      })
    })

    it('disables the bulk export buttons for the default "All time" range', async () => {
      const { getByRole, getByText } = await render(<HistoryScreen />)

      expect(getByRole('button', { name: 'Export PDF' }).props.accessibilityState.disabled).toBe(
        true,
      )
      expect(getByRole('button', { name: 'Export CSV' }).props.accessibilityState.disabled).toBe(
        true,
      )
      expect(getByText('Choose a specific date range (not All time) to export.')).toBeTruthy()
    })

    it('enables the bulk export buttons once a concrete preset is chosen', async () => {
      const { getByRole } = await render(<HistoryScreen />)

      await fireEvent.press(getByRole('button', { name: 'Last 30 days' }))

      expect(getByRole('button', { name: 'Export PDF' }).props.accessibilityState.disabled).toBe(
        false,
      )
      expect(getByRole('button', { name: 'Export CSV' }).props.accessibilityState.disabled).toBe(
        false,
      )
    })

    it('fetches the full range and shares a PDF when "Export PDF" is pressed', async () => {
      mockFetchQuery.mockResolvedValue([fullReport])
      mockPrintToFileAsync.mockResolvedValue({ uri: 'file:///sadhana-history.pdf' })
      mockShareAsync.mockResolvedValue(undefined)

      const today = getLocalDateIso()
      const expectedFromDate = addDaysIso(today, -29)

      const { getByRole } = await render(<HistoryScreen />)
      await fireEvent.press(getByRole('button', { name: 'Last 30 days' }))
      await fireEvent.press(getByRole('button', { name: 'Export PDF' }))

      expect(mockFetchQuery).toHaveBeenCalledTimes(1)
      expect(mockPrintToFileAsync).toHaveBeenCalledWith({
        html: buildSadhanaHistoryHtml([fullReport], expectedFromDate, today),
      })
      expect(mockShareAsync).toHaveBeenCalledWith('file:///sadhana-history.pdf', {
        mimeType: 'application/pdf',
        dialogTitle: `Sadhana Reports ${expectedFromDate} to ${today}`,
      })
    })

    it('fetches the full range and shares a CSV file when "Export CSV" is pressed', async () => {
      mockFetchQuery.mockResolvedValue([fullReport])
      mockWriteAsStringAsync.mockResolvedValue(undefined)
      mockShareAsync.mockResolvedValue(undefined)

      const { getByRole } = await render(<HistoryScreen />)
      await fireEvent.press(getByRole('button', { name: 'Last 30 days' }))
      await fireEvent.press(getByRole('button', { name: 'Export CSV' }))

      expect(mockFetchQuery).toHaveBeenCalledTimes(1)
      expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/^file:\/\/\/cache\/Sadhana-.*\.csv$/),
        buildSadhanaHistoryCsv([fullReport]),
        { encoding: 'utf8' },
      )
      expect(mockShareAsync).toHaveBeenCalledWith(
        expect.stringMatching(/^file:\/\/\/cache\/Sadhana-.*\.csv$/),
        { mimeType: 'text/csv', dialogTitle: expect.stringContaining('Sadhana Reports') },
      )
    })

    it('shows an error message when the bulk export fails', async () => {
      mockFetchQuery.mockRejectedValue(new Error('network error'))

      const { getByRole, findByText } = await render(<HistoryScreen />)
      await fireEvent.press(getByRole('button', { name: 'Last 30 days' }))
      await fireEvent.press(getByRole('button', { name: 'Export PDF' }))

      await findByText('Something went wrong exporting your reports. Please try again.')
    })
  })
})
