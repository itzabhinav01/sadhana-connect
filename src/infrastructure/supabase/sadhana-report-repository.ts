import type { SadhanaReport } from '@/domain/entities/sadhana-report'
import type {
  SadhanaReportRepository,
  UpsertSadhanaReportParams,
} from '@/domain/repositories/sadhana-report-repository'
import { supabase } from '@/infrastructure/supabase/client'

interface SadhanaReportRow {
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

const SELECT_COLUMNS =
  'id, profile_id, report_date, rounds_before_4_30am, rounds_till_7am, last_round_time, total_rounds, reading_minutes, book_name, hearing_minutes, speaker_name, sleep_time, wake_time, day_rest_minutes, total_rest_minutes, office_going_time, office_return_time, notes, signature_text, created_at, updated_at'

function mapRow(row: SadhanaReportRow): SadhanaReport {
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

    return data ? mapRow(data as SadhanaReportRow) : null
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

    return mapRow(data as SadhanaReportRow)
  },

  async listReportsInRange(profileId, startDate, endDate) {
    // Uses the (profile_id, report_date) unique-constraint index as an
    // index range scan — no new index required.
    const { data, error } = await supabase
      .from('sadhana_reports')
      .select(SELECT_COLUMNS)
      .eq('profile_id', profileId)
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .order('report_date', { ascending: true })

    if (error) throw error

    return (data as SadhanaReportRow[]).map(mapRow)
  },

  async listRecentReports(profileId, limit) {
    const { data, error } = await supabase
      .from('sadhana_reports')
      .select(SELECT_COLUMNS)
      .eq('profile_id', profileId)
      .order('report_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data as SadhanaReportRow[]).map(mapRow)
  },
}
