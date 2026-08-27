jest.mock('../../../src/application/japa/use-japa-counter', () => ({
  useJapaCounter: jest.fn(),
}))

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

import { cleanup, fireEvent, render } from '@testing-library/react-native'

import { useJapaCounter } from '../../../src/application/japa/use-japa-counter'
import JapaCounterScreen from './japa'

const mockUseJapaCounter = useJapaCounter as jest.Mock

function makeJapa(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    isLoaded: true,
    totalTapsToday: 0,
    completedRounds: 0,
    currentRound: 1,
    currentBead: 0,
    targetRounds: 16,
    targetProgress: 0,
    targetReached: false,
    tap: jest.fn(),
    undo: jest.fn(),
    reset: jest.fn(),
    setTarget: jest.fn(),
    ...overrides,
  }
}

describe('JapaCounterScreen', () => {
  afterEach(async () => {
    await cleanup()
  })

  beforeEach(() => {
    mockPush.mockReset()
  })

  it('shows a loading screen while not yet loaded', async () => {
    mockUseJapaCounter.mockReturnValue(makeJapa({ isLoaded: false }))

    const { getByText } = await render(<JapaCounterScreen />)
    expect(getByText('Loading…')).toBeTruthy()
  })

  it('shows the current round and progress', async () => {
    mockUseJapaCounter.mockReturnValue(
      makeJapa({ currentRound: 2, completedRounds: 1, targetRounds: 16 }),
    )

    const { getByText } = await render(<JapaCounterScreen />)
    expect(getByText('Round 2')).toBeTruthy()
    expect(getByText('1 of 16 rounds today')).toBeTruthy()
  })

  it('shows "target reached" once the target is met', async () => {
    mockUseJapaCounter.mockReturnValue(
      makeJapa({ completedRounds: 16, targetRounds: 16, targetReached: true }),
    )

    const { getByText } = await render(<JapaCounterScreen />)
    expect(getByText('16 of 16 rounds today — target reached')).toBeTruthy()
  })

  it('taps the counter when the tap button is pressed', async () => {
    const tap = jest.fn()
    mockUseJapaCounter.mockReturnValue(makeJapa({ tap }))

    const { getByRole } = await render(<JapaCounterScreen />)
    await fireEvent.press(getByRole('button', { name: /Tap to count/ }))

    expect(tap).toHaveBeenCalledTimes(1)
  })

  it('disables Undo when there are no taps yet, and enables it once there are', async () => {
    mockUseJapaCounter.mockReturnValue(makeJapa({ totalTapsToday: 0 }))
    const { getByRole, rerender } = await render(<JapaCounterScreen />)
    expect(getByRole('button', { name: 'Undo' })).toBeDisabled()

    const undo = jest.fn()
    mockUseJapaCounter.mockReturnValue(makeJapa({ totalTapsToday: 1, undo }))
    await rerender(<JapaCounterScreen />)

    const undoButton = getByRole('button', { name: 'Undo' })
    expect(undoButton).toBeEnabled()
    await fireEvent.press(undoButton)
    expect(undo).toHaveBeenCalledTimes(1)
  })

  it('requires a two-step confirm before resetting', async () => {
    const reset = jest.fn()
    mockUseJapaCounter.mockReturnValue(makeJapa({ totalTapsToday: 5, reset }))

    const { getByRole, getByText, queryByRole } = await render(<JapaCounterScreen />)
    await fireEvent.press(getByRole('button', { name: 'Reset' }))

    expect(getByText("Reset today's count?")).toBeTruthy()
    expect(reset).not.toHaveBeenCalled()

    await fireEvent.press(getByRole('button', { name: 'Confirm' }))
    expect(reset).toHaveBeenCalledTimes(1)
    expect(queryByRole('button', { name: 'Confirm' })).toBeNull()
  })

  it('cancelling the reset confirm leaves the count untouched', async () => {
    const reset = jest.fn()
    mockUseJapaCounter.mockReturnValue(makeJapa({ totalTapsToday: 5, reset }))

    const { getByRole, queryByText } = await render(<JapaCounterScreen />)
    await fireEvent.press(getByRole('button', { name: 'Reset' }))
    await fireEvent.press(getByRole('button', { name: 'Cancel' }))

    expect(reset).not.toHaveBeenCalled()
    expect(queryByText("Reset today's count?")).toBeNull()
  })

  it('calls setTarget with a valid new target', async () => {
    const setTarget = jest.fn()
    mockUseJapaCounter.mockReturnValue(makeJapa({ targetRounds: 16, setTarget }))

    const { getByLabelText } = await render(<JapaCounterScreen />)
    await fireEvent.changeText(getByLabelText('Daily target (rounds)'), '32')

    expect(setTarget).toHaveBeenCalledWith(32)
  })

  it('does not call setTarget for an invalid value, and reverts the field on blur', async () => {
    const setTarget = jest.fn()
    mockUseJapaCounter.mockReturnValue(makeJapa({ targetRounds: 16, setTarget }))

    const { getByLabelText } = await render(<JapaCounterScreen />)
    const input = getByLabelText('Daily target (rounds)')
    await fireEvent.changeText(input, '0')
    expect(setTarget).not.toHaveBeenCalled()

    await fireEvent(input, 'blur')
    expect(input.props.value).toBe('16')
  })

  it('hides "Use in Sadhana" when no rounds are completed yet', async () => {
    mockUseJapaCounter.mockReturnValue(makeJapa({ completedRounds: 0 }))

    const { queryByText } = await render(<JapaCounterScreen />)
    expect(queryByText("Use today's completed rounds in Sadhana")).toBeNull()
  })

  it('navigates to the Sadhana form with the completed rounds pre-filled', async () => {
    mockUseJapaCounter.mockReturnValue(makeJapa({ completedRounds: 3 }))

    const { getByRole } = await render(<JapaCounterScreen />)
    await fireEvent.press(getByRole('button', { name: "Use today's completed rounds in Sadhana" }))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/devotee/sadhana',
      params: expect.objectContaining({ prefillRounds: '3' }),
    })
  })
})
