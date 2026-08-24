import { describe, expect, it } from 'vitest'

import {
  emptyFormValues,
  formValuesToUpsertParams,
  reportToFormValues,
} from '@/application/sadhana/sadhana-form-mapping'
import type { SadhanaReport } from '@sadhana-connect/domain/entities/sadhana-report'

const report: SadhanaReport = {
  id: 'report-1',
  profileId: 'user-1',
  reportDate: '2026-01-15',
  roundsBefore430: 4,
  roundsTill7am: 8,
  lastRoundTime: '06:45',
  totalRounds: 16,
  readingMinutes: 15,
  bookName: 'Bhagavad Gita',
  hearingMinutes: 30,
  speakerName: 'HG Devotee Prabhu',
  sleepTime: '22:00',
  wakeTime: '03:30',
  dayRestMinutes: 20,
  totalRestMinutes: 360,
  officeGoingTime: '09:00',
  officeReturnTime: '18:00',
  notes: 'Good day',
  signatureText: 'Test Devotee',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('emptyFormValues', () => {
  it('produces blank fields for the given date', () => {
    const values = emptyFormValues('2026-01-15')
    expect(values.reportDate).toBe('2026-01-15')
    expect(values.roundsBefore430).toBe('')
    expect(values.signatureText).toBe('')
  })
})

describe('reportToFormValues', () => {
  it('converts a stored report into string form values', () => {
    const values = reportToFormValues(report)
    expect(values.roundsBefore430).toBe('4')
    expect(values.totalRounds).toBe('16')
    expect(values.bookName).toBe('Bhagavad Gita')
    expect(values.signatureText).toBe('Test Devotee')
  })

  it('converts null nullable fields to empty strings', () => {
    const values = reportToFormValues({
      ...report,
      bookName: null,
      speakerName: null,
      lastRoundTime: null,
      notes: null,
    })
    expect(values.bookName).toBe('')
    expect(values.speakerName).toBe('')
    expect(values.lastRoundTime).toBe('')
    expect(values.notes).toBe('')
  })
})

describe('formValuesToUpsertParams', () => {
  it('converts form strings back into typed upsert params', () => {
    const params = formValuesToUpsertParams(reportToFormValues(report))
    expect(params.roundsBefore430).toBe(4)
    expect(params.roundsTill7am).toBe(8)
    expect(params.totalRounds).toBe(16)
    expect(params.bookName).toBe('Bhagavad Gita')
    expect(params.signatureText).toBe('Test Devotee')
  })

  it('converts blank optional numeric fields to 0, not null', () => {
    const params = formValuesToUpsertParams(emptyFormValues('2026-01-15'))
    expect(params.roundsBefore430).toBe(0)
    expect(params.readingMinutes).toBe(0)
    expect(params.dayRestMinutes).toBe(0)
  })

  it('converts blank optional text/time fields to null, not empty string', () => {
    const params = formValuesToUpsertParams(emptyFormValues('2026-01-15'))
    expect(params.bookName).toBeNull()
    expect(params.speakerName).toBeNull()
    expect(params.lastRoundTime).toBeNull()
    expect(params.notes).toBeNull()
  })

  it('keeps rounds and rest fields independent through the round trip', () => {
    const params = formValuesToUpsertParams({
      ...emptyFormValues('2026-01-15'),
      roundsBefore430: '10',
      roundsTill7am: '10',
      totalRounds: '1',
      dayRestMinutes: '500',
      totalRestMinutes: '1',
      signatureText: 'Test Devotee',
    })
    expect(params.roundsBefore430).toBe(10)
    expect(params.roundsTill7am).toBe(10)
    expect(params.totalRounds).toBe(1)
    expect(params.dayRestMinutes).toBe(500)
    expect(params.totalRestMinutes).toBe(1)
  })
})
