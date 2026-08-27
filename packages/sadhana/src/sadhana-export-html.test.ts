import { describe, expect, it } from 'vitest'

import type { SadhanaReport } from '@sadhana-connect/domain'

import { buildSadhanaReportHtml } from './sadhana-export-html'

function makeReport(overrides: Partial<SadhanaReport> = {}): SadhanaReport {
  return {
    id: 'report-1',
    profileId: 'user-1',
    reportDate: '2026-01-05',
    roundsBefore430: 4,
    roundsTill7am: 8,
    lastRoundTime: '06:45',
    totalRounds: 16,
    readingMinutes: 15,
    bookName: 'Bhagavad-gītā As It Is',
    hearingMinutes: 30,
    speakerName: 'HG Example Prabhu',
    sleepTime: '22:00',
    wakeTime: '04:00',
    dayRestMinutes: 20,
    totalRestMinutes: 45,
    officeGoingTime: '09:30',
    officeReturnTime: '18:00',
    notes: 'Felt good today.',
    signatureText: 'Test Devotee Dasa',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildSadhanaReportHtml', () => {
  it('produces a well-formed standalone HTML document', () => {
    const html = buildSadhanaReportHtml(makeReport())

    expect(html).toMatch(/^<!doctype html>/)
    expect(html).toContain('<html>')
    expect(html).toContain('</html>')
  })

  it('includes the report date, formatted DD-MM-YYYY', () => {
    const html = buildSadhanaReportHtml(makeReport({ reportDate: '2026-03-01' }))

    expect(html).toContain('Date: 01-03-2026')
  })

  it('includes every section title and every field label/value', () => {
    const html = buildSadhanaReportHtml(makeReport())

    expect(html).toContain('Chanting')
    expect(html).toContain('Rounds before 4:30 AM')
    expect(html).toContain('4 Rounds')
    expect(html).toContain('Reading')
    expect(html).toContain('Bhagavad-gītā As It Is')
    expect(html).toContain('Signature')
    expect(html).toContain('Test Devotee Dasa')
  })

  it('escapes HTML-significant characters in free-text fields', () => {
    const html = buildSadhanaReportHtml(
      makeReport({
        bookName: `<script>alert('x')</script> & "Nectar"`,
        notes: `Line one\nLine <two>`,
      }),
    )

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;Nectar&quot;')
    expect(html).toContain('Line &lt;two&gt;')
  })

  it('renders an em dash for unset nullable fields rather than "undefined" or "null"', () => {
    const html = buildSadhanaReportHtml(
      makeReport({ bookName: null, speakerName: null, notes: null }),
    )

    expect(html).not.toContain('undefined')
    expect(html).not.toContain('null')
    expect(html).toContain('—')
  })
})
