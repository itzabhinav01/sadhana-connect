import { addDaysIso, buildDateRangeList, getLocalDateIso } from '@sadhana-connect/shared'

export interface SadhanaDateRange {
  fromDate: string
  toDate: string
}

// Custom ranges longer than this are rejected outright (see
// validateDateRange) rather than silently clamped — bounds worst-case
// query size and chart density with the simplest possible rule.
export const MAX_CUSTOM_RANGE_DAYS = 366

export type DateRangeValidationResult =
  | { valid: true }
  | { valid: false; error: string }

// The upper bound is capped at local today by the caller (same
// defensive pattern as History's toDate cap — the DB has no CHECK
// constraint against a future report_date). This function only rejects
// what the *user* got wrong and can fix: an inverted range, or one
// that's too long. It never silently rewrites either date.
export function validateDateRange(
  fromDate: string,
  toDate: string,
): DateRangeValidationResult {
  if (fromDate > toDate) {
    return { valid: false, error: 'From date must be before To date.' }
  }

  const dayCount = buildDateRangeList(fromDate, toDate).length
  if (dayCount > MAX_CUSTOM_RANGE_DAYS) {
    return {
      valid: false,
      error: `Custom range cannot be longer than ${MAX_CUSTOM_RANGE_DAYS} days.`,
    }
  }

  return { valid: true }
}

// "Last N days" always ends today and is N days long inclusive — e.g.
// N=7 spans today and the 6 days before it.
export function getLastNDaysRange(
  days: number,
  today: string = getLocalDateIso(),
): SadhanaDateRange {
  return { fromDate: addDaysIso(today, -(days - 1)), toDate: today }
}
