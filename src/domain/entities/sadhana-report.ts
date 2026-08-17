// rounds_before_4_30am, rounds_till_7am, and total_rounds are independent
// values by design (approved product decision, Phase 6) — nothing here
// derives one from the others, and none of it is validated against the
// others. Same for day_rest_minutes vs total_rest_minutes.
export interface SadhanaReport {
  id: string
  profileId: string
  reportDate: string // 'YYYY-MM-DD'
  roundsBefore430: number
  roundsTill7am: number
  lastRoundTime: string | null // 'HH:mm'
  totalRounds: number
  readingMinutes: number
  bookName: string | null
  hearingMinutes: number
  speakerName: string | null
  sleepTime: string | null // 'HH:mm'
  wakeTime: string | null // 'HH:mm'
  dayRestMinutes: number
  totalRestMinutes: number
  officeGoingTime: string | null // 'HH:mm'
  officeReturnTime: string | null // 'HH:mm'
  notes: string | null
  signatureText: string
  createdAt: string
  updatedAt: string
}
