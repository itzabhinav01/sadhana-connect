import { describe, expect, it } from 'vitest'

import { DEVOTEE_REPORT_SUMMARY_SELECT_COLUMNS } from '@sadhana-connect/infra-supabase/mentor-repository'

// Phase 20 performance: verifies the exact column string sent to
// PostgREST for listReportsForDevotees, since that string is what
// actually determines payload size over the wire — not an
// implementation detail.
describe('DEVOTEE_REPORT_SUMMARY_SELECT_COLUMNS (listReportsForDevotees — mentor dashboard summary)', () => {
  const columns = DEVOTEE_REPORT_SUMMARY_SELECT_COLUMNS.split(',').map((c) => c.trim())

  it('selects exactly the fields calculateMentorDevoteeSummaries reads', () => {
    expect(columns.sort()).toEqual(['profile_id', 'report_date', 'total_rounds'].sort())
  })

  it('excludes every other sadhana_reports field', () => {
    for (const column of [
      'id',
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
      'reading_minutes',
      'hearing_minutes',
      'day_rest_minutes',
      'total_rest_minutes',
      'rounds_before_4_30am',
      'rounds_till_7am',
    ]) {
      expect(columns).not.toContain(column)
    }
  })
})
