jest.mock('../../../src/application/theme/use-theme', () => ({
  useTheme: () => ({
    colors: require('../../../src/shared/theme').lightColors,
    resolvedTheme: 'light',
    theme: 'system',
    setTheme: jest.fn(),
  }),
}))

jest.mock('../../../../../packages/sadhana/src/use-sadhana-report', () => ({
  useSadhanaReport: jest.fn(),
}))

jest.mock('../../../../../packages/sadhana/src/use-upsert-sadhana-report', () => ({
  useUpsertSadhanaReport: jest.fn(),
}))

const mockUseLocalSearchParams = jest.fn(() => ({}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: jest.fn(() => ({ back: jest.fn() })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'
import { useSadhanaReport, useUpsertSadhanaReport } from '@sadhana-connect/sadhana'

import SadhanaFormScreen from './sadhana'

const mockUseSadhanaReport = useSadhanaReport as jest.Mock
const mockUseUpsertSadhanaReport = useUpsertSadhanaReport as jest.Mock

describe('SadhanaFormScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockUseSadhanaReport.mockReturnValue({ isPending: false, data: null })
    mockUseUpsertSadhanaReport.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false })
    mockUseLocalSearchParams.mockReturnValue({})
  })

  it('shows "Save Sadhana" for a new report', async () => {
    const { getByRole } = await render(<SadhanaFormScreen />)
    expect(getByRole('button', { name: 'Save Sadhana' })).toBeTruthy()
  })

  it('shows "Update Sadhana" when a report already exists for the date', async () => {
    mockUseSadhanaReport.mockReturnValue({
      isPending: false,
      data: {
        id: 'r1',
        profileId: 'u1',
        reportDate: '2026-08-01',
        roundsBefore430: 4,
        roundsTill7am: 4,
        lastRoundTime: null,
        totalRounds: 16,
        readingMinutes: 10,
        bookName: null,
        hearingMinutes: 10,
        speakerName: null,
        sleepTime: null,
        wakeTime: null,
        dayRestMinutes: 0,
        totalRestMinutes: 0,
        officeGoingTime: null,
        officeReturnTime: null,
        notes: null,
        signatureText: 'Devotee',
        createdAt: '',
        updatedAt: '',
      },
    })

    const { getByRole } = await render(<SadhanaFormScreen />)
    expect(getByRole('button', { name: 'Update Sadhana' })).toBeTruthy()
  })

  it('requires a signature before submitting', async () => {
    const mutate = jest.fn()
    mockUseUpsertSadhanaReport.mockReturnValue({ mutate, isPending: false, isError: false })

    const { getByRole, findByText } = await render(<SadhanaFormScreen />)
    await fireEvent.press(getByRole('button', { name: 'Save Sadhana' }))

    await findByText(/signature is required/i)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits round counts independently, without deriving one from another', async () => {
    const mutate = jest.fn()
    mockUseUpsertSadhanaReport.mockReturnValue({ mutate, isPending: false, isError: false })

    const { getByLabelText, getByRole } = await render(<SadhanaFormScreen />)
    await fireEvent.changeText(getByLabelText('Rounds before 4:30 AM'), '5')
    await fireEvent.changeText(getByLabelText('Rounds till 7 AM'), '3')
    await fireEvent.changeText(getByLabelText('Total Rounds'), '20')
    await fireEvent.press(getByRole('button', { name: 'Details' }))
    await fireEvent.changeText(getByLabelText('Signature'), 'Devotee')
    await fireEvent.press(getByRole('button', { name: 'Save Sadhana' }))

    expect(mutate).toHaveBeenCalledTimes(1)
    const params = mutate.mock.calls[0][0]
    expect(params.roundsBefore430).toBe(5)
    expect(params.roundsTill7am).toBe(3)
    expect(params.totalRounds).toBe(20)
  })

  it('fills Total Rounds from a quick-amount button', async () => {
    const { getByLabelText, getByRole } = await render(<SadhanaFormScreen />)
    await fireEvent.press(getByRole('button', { name: 'Set Total Rounds to 16' }))
    expect(getByLabelText('Total Rounds').props.value).toBe('16')
  })

  it('adjusts Rounds before 4:30 AM with the stepper buttons', async () => {
    const { getByLabelText, getByRole } = await render(<SadhanaFormScreen />)
    await fireEvent.press(getByRole('button', { name: 'Increase Rounds before 4:30 AM' }))
    await fireEvent.press(getByRole('button', { name: 'Increase Rounds before 4:30 AM' }))
    expect(getByLabelText('Rounds before 4:30 AM').props.value).toBe('2')

    await fireEvent.press(getByRole('button', { name: 'Decrease Rounds before 4:30 AM' }))
    expect(getByLabelText('Rounds before 4:30 AM').props.value).toBe('1')
  })

  it('pre-fills Total Rounds from ?prefillRounds= when arriving from the Japa Counter', async () => {
    mockUseLocalSearchParams.mockReturnValue({ prefillRounds: '12' })

    const { getByLabelText } = await render(<SadhanaFormScreen />)

    expect(getByLabelText('Total Rounds').props.value).toBe('12')
  })

  it('ignores an invalid ?prefillRounds= value', async () => {
    mockUseLocalSearchParams.mockReturnValue({ prefillRounds: 'not-a-number' })

    const { getByLabelText } = await render(<SadhanaFormScreen />)

    expect(getByLabelText('Total Rounds').props.value).toBe('')
  })

  it('starts a new report with only Chanting expanded', async () => {
    const { getByLabelText, queryByLabelText } = await render(<SadhanaFormScreen />)

    expect(getByLabelText('Total Rounds')).toBeTruthy()
    expect(queryByLabelText('Reading Minutes')).toBeNull()
    expect(queryByLabelText('Signature')).toBeNull()
  })

  it('expands a collapsed section on tap and shows its fields', async () => {
    const { getByRole, getByLabelText } = await render(<SadhanaFormScreen />)

    await fireEvent.press(getByRole('button', { name: /Reading/ }))

    expect(getByLabelText('Reading Minutes')).toBeTruthy()
    expect(getByLabelText('Book Name')).toBeTruthy()
  })

  it('auto-expands only the sections that already contain data on an existing report', async () => {
    mockUseSadhanaReport.mockReturnValue({
      isPending: false,
      data: {
        id: 'r1',
        profileId: 'u1',
        reportDate: '2026-08-01',
        roundsBefore430: 4,
        roundsTill7am: 4,
        lastRoundTime: null,
        totalRounds: 16,
        readingMinutes: 0,
        bookName: null,
        hearingMinutes: 0,
        speakerName: null,
        sleepTime: null,
        wakeTime: null,
        dayRestMinutes: 0,
        totalRestMinutes: 0,
        officeGoingTime: null,
        officeReturnTime: null,
        notes: null,
        signatureText: 'Devotee',
        createdAt: '',
        updatedAt: '',
      },
    })

    const { getByLabelText, queryByLabelText } = await render(<SadhanaFormScreen />)

    // Chanting has real data (16 rounds) — expanded.
    expect(getByLabelText('Total Rounds')).toBeTruthy()
    // Reading is all-zero/empty — collapsed.
    expect(queryByLabelText('Reading Minutes')).toBeNull()
  })
})
