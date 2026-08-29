import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsPage } from './SettingsPage'

vi.mock('@/presentation/components/shared/DailySadhanaReminderCard', () => ({
  DailySadhanaReminderCard: () => <div data-testid="daily-reminder-card">Reminder Card</div>,
}))

vi.mock('@/presentation/pages/SettingsInstallSection', () => ({
  SettingsInstallSection: () => <div data-testid="install-section">Install Section</div>,
}))

describe('SettingsPage', () => {
  it('renders title, daily reminder section, and install section', () => {
    render(<SettingsPage />)

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByTestId('daily-reminder-card')).toBeInTheDocument()
    expect(screen.getByTestId('install-section')).toBeInTheDocument()
  })
})
