import type {
  SadhanaReport,
  SadhanaReportHistoryEntry,
  SadhanaReportRangeSummary,
} from '@/domain/entities/sadhana-report'
import type {
  ListSadhanaReportsOptions,
  ListSadhanaReportsResult,
  SadhanaReportRepository,
  UpsertSadhanaReportParams,
} from '@/domain/repositories/sadhana-report-repository'
import { supabase } from '@/infrastructure/supabase/client'

export interface SadhanaReportRow {
  id: string
  profile_id: string
  report_date: string
  rounds_before_4_30am: number
  rounds_till_7am: number
  last_round_time: string | null
  total_rounds: number
  reading_minutes: number
  book_name: string | null
  hearing_minutes: number
  speaker_name: string | null
  sleep_time: string | null
  wake_time: string | null
  day_rest_minutes: number
  total_rest_minutes: number
  office_going_time: string | null
  office_return_time: string | null
  notes: string | null
  signature_text: string
  created_at: string
  updated_at: string
}

export const SADHANA_REPORT_SELECT_COLUMNS =
  'id, profile_id, report_date, rounds_before_4_30am, rounds_till_7am, last_round_time, total_rounds, reading_minutes, book_name, hearing_minutes, speaker_name, sleep_time, wake_time, day_rest_minutes, total_rest_minutes, office_going_time, office_return_time, notes, signature_text, created_at, updated_at'

// Kept as a short local alias so the rest of this file reads the same as
// before the export.
const SELECT_COLUMNS = SADHANA_REPORT_SELECT_COLUMNS

// Narrower selection for listReportsInRange (Phase 20 performance) —
// this method backs both the devotee weekly dashboard chart and the
// Analytics page (useWeeklySadhanaSummary / useSadhanaAnalytics), and
// neither consumer reads anything beyond these six fields (traced via
// calculateWeeklySummary and calculateSadhanaAnalytics). Every other
// SadhanaReport field (notes, book/speaker name, signature, times, id,
// profile_id, timestamps...) is genuinely unused by either chart.
export const RANGE_SUMMARY_SELECT_COLUMNS =
  'report_date, total_rounds, reading_minutes, hearing_minutes, day_rest_minutes, total_rest_minutes'

interface SadhanaReportRangeSummaryRow {
  report_date: string
  total_rounds: number
  reading_minutes: number
  hearing_minutes: number
  day_rest_minutes: number
  total_rest_minutes: number
}

function mapRangeSummaryRow(
  row: SadhanaReportRangeSummaryRow,
): SadhanaReportRangeSummary {
  return {
    reportDate: row.report_date,
    totalRounds: row.total_rounds,
    readingMinutes: row.reading_minutes,
    hearingMinutes: row.hearing_minutes,
    dayRestMinutes: row.day_rest_minutes,
    totalRestMinutes: row.total_rest_minutes,
  }
}

// listReportHistory's shape (Phase 20B) — backs DevoteeSadhanaHistorySection.
// Own narrow selection rather than reusing RANGE_SUMMARY_SELECT_COLUMNS:
// this view needs `id` (to key the per-report comments toggle), which
// that selection's own traced consumers (weekly chart, Analytics) never
// read and deliberately omit.
export const HISTORY_SELECT_COLUMNS =
  'id, report_date, total_rounds, reading_minutes, hearing_minutes'

interface SadhanaReportHistoryRow {
  id: string
  report_date: string
  total_rounds: number
  reading_minutes: number
  hearing_minutes: number
}

function mapHistoryRow(row: SadhanaReportHistoryRow): SadhanaReportHistoryEntry {
  return {
    id: row.id,
    reportDate: row.report_date,
    totalRounds: row.total_rounds,
    readingMinutes: row.reading_minutes,
    hearingMinutes: row.hearing_minutes,
  }
}

export function mapSadhanaReportRow(row: SadhanaReportRow): SadhanaReport {
  return {
    id: row.id,
    profileId: row.profile_id,
    reportDate: row.report_date,
    roundsBefore430: row.rounds_before_4_30am,
    roundsTill7am: row.rounds_till_7am,
    lastRoundTime: row.last_round_time,
    totalRounds: row.total_rounds,
    readingMinutes: row.reading_minutes,
    bookName: row.book_name,
    hearingMinutes: row.hearing_minutes,
    speakerName: row.speaker_name,
    sleepTime: row.sleep_time,
    wakeTime: row.wake_time,
    dayRestMinutes: row.day_rest_minutes,
    totalRestMinutes: row.total_rest_minutes,
    officeGoingTime: row.office_going_time,
    officeReturnTime: row.office_return_time,
    notes: row.notes,
    signatureText: row.signature_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapParamsToRow(profileId: string, params: UpsertSadhanaReportParams) {
  return {
    profile_id: profileId,
    report_date: params.reportDate,
    rounds_before_4_30am: params.roundsBefore430,
    rounds_till_7am: params.roundsTill7am,
    last_round_time: params.lastRoundTime,
    total_rounds: params.totalRounds,
    reading_minutes: params.readingMinutes,
    book_name: params.bookName,
    hearing_minutes: params.hearingMinutes,
    speaker_name: params.speakerName,
    sleep_time: params.sleepTime,
    wake_time: params.wakeTime,
    day_rest_minutes: params.dayRestMinutes,
    total_rest_minutes: params.totalRestMinutes,
    office_going_time: params.officeGoingTime,
    office_return_time: params.officeReturnTime,
    notes: params.notes,
    signature_text: params.signatureText,
  }
}

export const supabaseSadhanaReportRepository: SadhanaReportRepository = {
  async getReportByDate(profileId, reportDate) {
    const { data, error } = await supabase
      .from('sadhana_reports')
      .select(SELECT_COLUMNS)
      .eq('profile_id', profileId)
      .eq('report_date', reportDate)
      .maybeSingle()

    if (error) throw error

    return data ? mapSadhanaReportRow(data as SadhanaReportRow) : null
  },

  async getReportDateById(reportId) {
    const { data, error } = await supabase
      .from('sadhana_reports')
      .select('report_date')
      .eq('id', reportId)
      .maybeSingle()

    if (error) throw error

    return data ? (data as { report_date: string }).report_date : null
  },

  async upsertReport(profileId, params) {
    const { data, error } = await supabase
      .from('sadhana_reports')
      .upsert(mapParamsToRow(profileId, params), {
        onConflict: 'profile_id,report_date',
      })
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapSadhanaReportRow(data as SadhanaReportRow)
  },

  async listReportsInRange(profileId, startDate, endDate) {
    // Uses the (profile_id, report_date) unique-constraint index as an
    // index range scan — no new index required.
    const { data, error } = await supabase
      .from('sadhana_reports')
      .select(RANGE_SUMMARY_SELECT_COLUMNS)
      .eq('profile_id', profileId)
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .order('report_date', { ascending: true })

    if (error) throw error

    return (data as SadhanaReportRangeSummaryRow[]).map(mapRangeSummaryRow)
  },

  async listRecentReports(profileId, limit) {
    const { data, error } = await supabase
      .from('sadhana_reports')
      .select(SELECT_COLUMNS)
      .eq('profile_id', profileId)
      .order('report_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data as SadhanaReportRow[]).map(mapSadhanaReportRow)
  },

  async listReports(
    profileId,
    options: ListSadhanaReportsOptions,
  ): Promise<ListSadhanaReportsResult> {
    // (profile_id, report_date) — the unique-constraint index — serves
    // this as a single index range scan: equality on profile_id, then a
    // bounded/ordered scan on report_date for the from/to/cursor bounds,
    // already in the LIMIT's requested (descending) order. No new index,
    // no COUNT(*) — `limit + 1` is how the next page is detected instead.
    let query = supabase
      .from('sadhana_reports')
      .select(SELECT_COLUMNS)
      .eq('profile_id', profileId)
      .order('report_date', { ascending: false })
      .limit(options.limit + 1)

    if (options.fromDate) {
      query = query.gte('report_date', options.fromDate)
    }
    if (options.toDate) {
      query = query.lte('report_date', options.toDate)
    }
    if (options.cursor) {
      query = query.lt('report_date', options.cursor)
    }

    const { data, error } = await query

    if (error) throw error

    const rows = (data as SadhanaReportRow[]).map(mapSadhanaReportRow)
    const hasNextPage = rows.length > options.limit
    const reports = hasNextPage ? rows.slice(0, options.limit) : rows
    const nextCursor = hasNextPage
      ? (reports[reports.length - 1]?.reportDate ?? null)
      : null

    return { reports, nextCursor }
  },

  async listReportHistory(profileId, startDate, endDate) {
    const { data, error } = await supabase
      .from('sadhana_reports')
      .select(HISTORY_SELECT_COLUMNS)
      .eq('profile_id', profileId)
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .order('report_date', { ascending: true })

    if (error) throw error

    return (data as SadhanaReportHistoryRow[]).map(mapHistoryRow)
  },
}
