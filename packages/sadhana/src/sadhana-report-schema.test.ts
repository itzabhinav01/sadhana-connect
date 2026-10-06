import { describe, expect, it } from 'vitest'

import { sadhanaReportSchema } from './sadhana-report-schema'
import { getLocalDateIso } from '@sadhana-connect/shared'

function validInput(overrides: Partial<Record<string, string>> = {}) {
  return {
    reportDate: getLocalDateIso(),
    roundsBefore430: '4',
    roundsTill7am: '8',
    lastRoundTime: '06:45',
    totalRounds: '16',
    readingMinutes: '15',
    bookName: 'Bhagavad Gita',
    hearingMinutes: '30',
    speakerName: 'HG Devotee Prabhu',
    studyHours: '2',
    sleepTime: '22:00',
    wakeTime: '03:30',
    dayRestMinutes: '20',
    totalRestMinutes: '6.5',
    officeGoingTime: '09:00',
    officeReturnTime: '18:00',
    notes: 'Good day',
    signatureText: 'Test Devotee',
    ...overrides,
  }
}

describe('sadhanaReportSchema', () => {
  it('accepts a fully filled valid report', () => {
    expect(sadhanaReportSchema.safeParse(validInput()).success).toBe(true)
  })

  it('accepts blank optional numeric/text/time fields across all sections', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({
        roundsBefore430: '',
        roundsTill7am: '',
        totalRounds: '',
        lastRoundTime: '',
        bookName: '',
        speakerName: '',
        studyHours: '',
        sleepTime: '',
        wakeTime: '',
        officeGoingTime: '',
        officeReturnTime: '',
        notes: '',
        signatureText: '',
        readingMinutes: '',
        hearingMinutes: '',
        dayRestMinutes: '',
        totalRestMinutes: '',
      }),
    )
    expect(result.success).toBe(true)
  })

  it('accepts decimal values for studyHours and totalRestMinutes', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({
        studyHours: '2.5',
        totalRestMinutes: '6.75',
      }),
    )
    expect(result.success).toBe(true)
  })

  it('rejects invalid decimal values for studyHours and totalRestMinutes', () => {
    expect(
      sadhanaReportSchema.safeParse(validInput({ studyHours: '2.555' })).success,
    ).toBe(false)
    expect(
      sadhanaReportSchema.safeParse(validInput({ totalRestMinutes: 'abc' })).success,
    ).toBe(false)
  })

  it('rejects a future report date', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isoTomorrow = getLocalDateIso(tomorrow)

    const result = sadhanaReportSchema.safeParse(
      validInput({ reportDate: isoTomorrow }),
    )
    expect(result.success).toBe(false)
  })

  it('accepts a past report date with no lower bound', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ reportDate: '2000-01-01' }),
    )
    expect(result.success).toBe(true)
  })

  it("accepts today's date", () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ reportDate: getLocalDateIso() }),
    )
    expect(result.success).toBe(true)
  })

  it('accepts a blank signature', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ signatureText: '   ' }),
    )
    expect(result.success).toBe(true)
  })

  it('rejects a non-numeric rounds value', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ roundsBefore430: 'abc' }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects a negative rounds value', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ roundsBefore430: '-1' }),
    )
    expect(result.success).toBe(false)
  })

  it('does not relate roundsBefore430, roundsTill7am, and totalRounds to each other', () => {
    // Deliberately mismatched — must still validate successfully. This is
    // the approved "independent fields" product decision, not a bug.
    const result = sadhanaReportSchema.safeParse(
      validInput({
        roundsBefore430: '10',
        roundsTill7am: '10',
        totalRounds: '1',
      }),
    )
    expect(result.success).toBe(true)
  })

  it('does not relate dayRestMinutes and totalRestMinutes to each other', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ dayRestMinutes: '500', totalRestMinutes: '1' }),
    )
    expect(result.success).toBe(true)
  })

  it('accepts the smallint maximum (32767) for a numeric field', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ totalRounds: '32767' }),
    )
    expect(result.success).toBe(true)
  })

  it('rejects one over the smallint maximum for a numeric field', () => {
    const result = sadhanaReportSchema.safeParse(
      validInput({ totalRounds: '32768' }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('totalRounds')
    }
  })
})
