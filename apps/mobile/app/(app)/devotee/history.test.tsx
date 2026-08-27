jest.mock('../../../../../packages/sadhana/src/use-sadhana-history', () => ({
  useSadhanaHistory: jest.fn(),
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

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  buildSadhanaReportHtml,
  buildWhatsAppShareUrl,
  formatSadhanaReportForText,
  useSadhanaHistory,
} from '@sadhana-connect/sadhana'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Linking, Share } from 'react-native'

import HistoryScreen from './history'

const mockUseSadhanaHistory = useSadhanaHistory as jest.Mock
const mockPrintToFileAsync = Print.printToFileAsync as jest.Mock
const mockShareAsync = Sharing.shareAsync as jest.Mock

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

  it('generates and shares a PDF when "Export PDF" is pressed', async () => {
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

  it('shows an error message when the PDF export fails', async () => {
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
})
