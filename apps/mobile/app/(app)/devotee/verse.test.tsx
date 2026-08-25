jest.mock('../../../../../packages/verse/src/use-verse-of-the-day', () => ({
  useVerseOfTheDay: jest.fn(),
}))

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}))

import * as Clipboard from 'expo-clipboard'
import { Linking } from 'react-native'
import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { useVerseOfTheDay } from '@sadhana-connect/verse'

import VerseOfTheDayScreen from './verse'

const mockUseVerseOfTheDay = useVerseOfTheDay as jest.Mock
const mockSetStringAsync = Clipboard.setStringAsync as jest.Mock

const citationOnlyVerse = {
  id: 'v1',
  chapter: 2,
  verseNumber: '47',
  sourceUrl: 'https://vedabase.io/en/library/bg/2/47/',
  orderIndex: 0,
  scheduledDate: null,
  content: null,
}

const verseWithContent = {
  ...citationOnlyVerse,
  content: {
    sanskritTransliteration: 'karmaṇy evādhikāras te',
    translation: 'You have a right to perform your prescribed duty.',
  },
}

describe('VerseOfTheDayScreen', () => {
  afterEach(async () => {
    await cleanup()
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    mockSetStringAsync.mockReset()
  })

  it('shows a loading state while the query is pending', async () => {
    mockUseVerseOfTheDay.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined })

    const { getByText } = await render(<VerseOfTheDayScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows an error message when the query fails', async () => {
    mockUseVerseOfTheDay.mockReturnValue({ isPending: false, isError: true, isSuccess: false, data: undefined })

    const { getByText } = await render(<VerseOfTheDayScreen />)
    expect(getByText(/something went wrong loading today's verse/i)).toBeTruthy()
  })

  it('shows an honest empty state when no verse is available, never a fabricated one', async () => {
    mockUseVerseOfTheDay.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: null })

    const { getByText } = await render(<VerseOfTheDayScreen />)
    expect(getByText("Today's verse is not available yet.")).toBeTruthy()
  })

  it('renders the citation without a Sanskrit/Translation block when content is null', async () => {
    mockUseVerseOfTheDay.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: citationOnlyVerse,
    })

    const { getByText, queryByText } = await render(<VerseOfTheDayScreen />)
    expect(getByText('Bhagavad-gītā As It Is 2.47')).toBeTruthy()
    expect(queryByText('Sanskrit')).toBeNull()
    expect(queryByText('Translation')).toBeNull()
  })

  it('renders the Sanskrit and Translation blocks when content is present', async () => {
    mockUseVerseOfTheDay.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: verseWithContent,
    })

    const { getByText } = await render(<VerseOfTheDayScreen />)
    expect(getByText('karmaṇy evādhikāras te')).toBeTruthy()
    expect(getByText('You have a right to perform your prescribed duty.')).toBeTruthy()
  })

  it('opens the VedaBase link on "Read on VedaBase"', async () => {
    mockUseVerseOfTheDay.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: citationOnlyVerse,
    })
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)

    const { getByRole } = await render(<VerseOfTheDayScreen />)
    await fireEvent.press(getByRole('button', { name: 'Read on VedaBase' }))

    expect(openURLSpy).toHaveBeenCalledWith(citationOnlyVerse.sourceUrl)
  })

  it('copies the exact citation text and shows "Copied" feedback', async () => {
    jest.useFakeTimers()
    mockUseVerseOfTheDay.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: citationOnlyVerse,
    })

    const { getByRole, findByRole } = await render(<VerseOfTheDayScreen />)
    await fireEvent.press(getByRole('button', { name: 'Copy Citation' }))

    expect(mockSetStringAsync).toHaveBeenCalledWith(
      'Bhagavad-gītā As It Is 2.47\nHis Divine Grace A. C. Bhaktivedanta Swami Prabhupāda\nhttps://vedabase.io/en/library/bg/2/47/',
    )
    await findByRole('button', { name: 'Copied' })

    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })
})
