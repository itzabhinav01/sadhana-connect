import { describe, expect, it } from 'vitest'

import {
  HISTORY_SELECT_COLUMNS,
  RANGE_SUMMARY_SELECT_COLUMNS,
  SADHANA_REPORT_SELECT_COLUMNS,
} from './sadhana-report-repository'

// Phase 20 performance: verifies the exact column strings sent to
// PostgREST for each query shape, since that string is what actually
// determines payload size over the wire — not an implementation detail.

describe('SADHANA_REPORT_SELECT_COLUMNS (getReportByDate/upsertReport/listRecentReports/listReports/listFullReportsInRange)', () => {
  const fullColumns = SADHANA_REPORT_SELECT_COLUMNS.split(',').map((c) => c.trim())

  it('still selects every field — deliberately NOT narrowed', () => {
    // Traced (Phase 20): listRecentReports backs the devotee dashboard's
    // Recent Reports list, whose SadhanaReportSummaryRow renders a
    // "Share to WhatsApp" link on every row via buildWhatsAppShareUrl,
    // which reads nearly every field (book/speaker name, all times,
    // signature, rest minutes...). Narrowing this query would silently
    // corrupt that share message for any dropped field, so it keeps the
    // full selection — a traced, deliberate decision, not an oversight.
    for (const column of [
      'id',
      'profile_id',
      'report_date',
      'rounds_before_4_30am',
      'rounds_till_7am',
      'last_round_time',
      'total_rounds',
      'reading_minutes',
      'book_name',
      'hearing_minutes',
      'speaker_name',
      'sleep_time',
      'wake_time',
      'day_rest_minutes',
      'total_rest_minutes',
      'office_going_time',
      'office_return_time',
      'notes',
      'signature_text',
      'created_at',
      'updated_at',
    ]) {
      expect(fullColumns).toContain(column)
    }
    expect(fullColumns).toHaveLength(21)
  })
})

describe('RANGE_SUMMARY_SELECT_COLUMNS (listReportsInRange — weekly dashboard chart + Analytics)', () => {
  const rangeColumns = RANGE_SUMMARY_SELECT_COLUMNS.split(',').map((c) => c.trim())

  it('selects exactly the fields calculateWeeklySummary/calculateSadhanaAnalytics read', () => {
    expect(rangeColumns.sort()).toEqual(
      [
        'report_date',
        'total_rounds',
        'reading_minutes',
        'hearing_minutes',
        'day_rest_minutes',
        'total_rest_minutes',
      ].sort(),
    )
  })

  it('excludes every field neither chart consumer reads', () => {
    for (const column of [
      'id',
      'profile_id',
      'book_name',
      'speaker_name',
      'notes',
      'signature_text',
      'last_round_time',
      'sleep_time',
      'wake_time',
      'office_going_time',
      'office_return_time',
      'created_at',
      'updated_at',
      'rounds_before_4_30am',
      'rounds_till_7am',
    ]) {
      expect(rangeColumns).not.toContain(column)
    }
  })
})

describe('HISTORY_SELECT_COLUMNS (listReportHistory — Phase 20B devotee oversight)', () => {
  const historyColumns = HISTORY_SELECT_COLUMNS.split(',').map((c) => c.trim())

  it('selects exactly the fields MentorDevoteeReportRow reads, including id for the comments toggle', () => {
    expect(historyColumns.sort()).toEqual(
      ['id', 'report_date', 'total_rounds', 'reading_minutes', 'hearing_minutes'].sort(),
    )
  })

  it('excludes every field the history row/comments toggle does not read', () => {
    for (const column of [
      'profile_id',
      'book_name',
      'speaker_name',
      'notes',
      'signature_text',
      'last_round_time',
      'sleep_time',
      'wake_time',
      'office_going_time',
      'office_return_time',
      'created_at',
      'updated_at',
      'rounds_before_4_30am',
      'rounds_till_7am',
      'day_rest_minutes',
      'total_rest_minutes',
    ]) {
      expect(historyColumns).not.toContain(column)
    }
  })
})
