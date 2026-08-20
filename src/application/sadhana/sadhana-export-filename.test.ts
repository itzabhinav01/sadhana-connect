import { describe, expect, it } from 'vitest'

import {
  buildSadhanaRangeExportFilename,
  buildSadhanaSingleExportFilename,
} from '@/application/sadhana/sadhana-export-filename'

describe('buildSadhanaSingleExportFilename', () => {
  it('builds the exact PDF filename', () => {
    expect(buildSadhanaSingleExportFilename('2026-08-19', 'pdf')).toBe(
      'Sadhana-2026-08-19.pdf',
    )
  })

  it('builds the exact text filename', () => {
    expect(buildSadhanaSingleExportFilename('2026-08-19', 'txt')).toBe(
      'Sadhana-2026-08-19.txt',
    )
  })

  it('uses the local report date string as-is, never a Date object', () => {
    // No timezone conversion can occur here since the input is already a
    // plain 'YYYY-MM-DD' string and no `new Date(...)` is ever built.
    expect(buildSadhanaSingleExportFilename('2026-01-01', 'pdf')).toBe(
      'Sadhana-2026-01-01.pdf',
    )
  })
})

describe('buildSadhanaRangeExportFilename', () => {
  it('builds the exact range PDF filename', () => {
    expect(buildSadhanaRangeExportFilename('2026-08-01', '2026-08-19', 'pdf')).toBe(
      'Sadhana-2026-08-01-to-2026-08-19.pdf',
    )
  })

  it('builds the exact range text filename', () => {
    expect(buildSadhanaRangeExportFilename('2026-08-01', '2026-08-19', 'txt')).toBe(
      'Sadhana-2026-08-01-to-2026-08-19.txt',
    )
  })
})
