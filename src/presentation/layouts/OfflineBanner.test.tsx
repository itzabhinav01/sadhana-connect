import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { OfflineBanner } from '@/presentation/layouts/OfflineBanner'

describe('OfflineBanner', () => {
  let originalOnLine: boolean

  beforeEach(() => {
    originalOnLine = navigator.onLine
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
    })
  })

  it('renders nothing while online', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })

    render(<OfflineBanner />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the offline message while offline', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    render(<OfflineBanner />)

    expect(
      screen.getByText(
        /you're offline — some features aren't available until you reconnect\./i,
      ),
    ).toBeInTheDocument()
  })

  it('disappears again once connectivity returns', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
