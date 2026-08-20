import { describe, expect, it } from 'vitest'

import { formatTime12Hour } from '@/shared/utils/format-time-12-hour'

describe('formatTime12Hour', () => {
  it('formats a morning time', () => {
    expect(formatTime12Hour('10:30:00')).toBe('10:30 AM')
  })

  it('formats an afternoon time', () => {
    expect(formatTime12Hour('14:05:00')).toBe('2:05 PM')
  })

  it('formats midnight (00:xx) as 12:xx AM', () => {
    expect(formatTime12Hour('00:15:00')).toBe('12:15 AM')
  })

  it('formats noon (12:xx) as 12:xx PM', () => {
    expect(formatTime12Hour('12:00:00')).toBe('12:00 PM')
  })

  it('converts a single-digit hour without a leading zero', () => {
    expect(formatTime12Hour('09:05:00')).toBe('9:05 AM')
  })

  it('strips seconds from HH:mm:ss values', () => {
    expect(formatTime12Hour('18:45:30')).toBe('6:45 PM')
  })

  it('accepts HH:mm values with no seconds', () => {
    expect(formatTime12Hour('06:45')).toBe('6:45 AM')
  })

  it('renders an em dash for null', () => {
    expect(formatTime12Hour(null)).toBe('—')
  })

  it('renders an em dash for undefined', () => {
    expect(formatTime12Hour(undefined)).toBe('—')
  })
})
