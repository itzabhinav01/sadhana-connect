import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DailySadhanaReminderCard } from './DailySadhanaReminderCard'

const mockToggleReminder = vi.fn()
const mockChangeReminderTime = vi.fn()
const mockSendTestNotification = vi.fn()

let mockEnabled = false
let mockReminderTime = '21:00'
let mockPermission = 'default'

vi.mock('@/application/reminders/use-daily-sadhana-reminder', () => ({
  useDailySadhanaReminder: () => ({
    isLoading: false,
    enabled: mockEnabled,
    reminderTime: mockReminderTime,
    permission: mockPermission,
    isSupported: true,
    toggleReminder: mockToggleReminder,
    changeReminderTime: mockChangeReminderTime,
    sendTestNotification: mockSendTestNotification,
  }),
}))

describe('DailySadhanaReminderCard (Web)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnabled = false
    mockReminderTime = '21:00'
    mockPermission = 'default'
  })

  it('renders disabled state by default', () => {
    render(<DailySadhanaReminderCard />)

    expect(screen.getByText('Daily Sadhana Reminder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeInTheDocument()
    expect(screen.getByText(/Turn on the switch above/)).toBeInTheDocument()
  })

  it('renders active presets and scheduled time when enabled', () => {
    mockEnabled = true
    mockReminderTime = '20:30'

    render(<DailySadhanaReminderCard />)

    expect(screen.getByRole('button', { name: 'Enabled' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '8:30 PM' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '9:00 PM' })).toBeInTheDocument()
    expect(screen.getByText(/Scheduled daily at/)).toBeInTheDocument()
  })

  it('calls toggleReminder when toggle button is clicked', () => {
    render(<DailySadhanaReminderCard />)

    fireEvent.click(screen.getByRole('button', { name: 'Disabled' }))
    expect(mockToggleReminder).toHaveBeenCalledWith(true)
  })

  it('calls changeReminderTime when a preset button is clicked', () => {
    mockEnabled = true

    render(<DailySadhanaReminderCard />)

    fireEvent.click(screen.getByRole('button', { name: '9:30 PM' }))
    expect(mockChangeReminderTime).toHaveBeenCalledWith('21:30')
  })
})
