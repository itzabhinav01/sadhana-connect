import type { SadhanaReport } from '@sadhana-connect/domain'
import type { UpsertSadhanaReportParams } from '@sadhana-connect/domain'
import type { SadhanaReportFormInput } from './sadhana-report-schema'

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value)
}

function toNullable(value: string): string | null {
  return value === '' ? null : value
}

export function formValuesToUpsertParams(
  values: SadhanaReportFormInput,
): UpsertSadhanaReportParams {
  return {
    reportDate: values.reportDate,
    roundsBefore430: toNumber(values.roundsBefore430),
    roundsTill7am: toNumber(values.roundsTill7am),
    lastRoundTime: toNullable(values.lastRoundTime),
    totalRounds: toNumber(values.totalRounds),
    readingMinutes: toNumber(values.readingMinutes),
    bookName: toNullable(values.bookName),
    hearingMinutes: toNumber(values.hearingMinutes),
    speakerName: toNullable(values.speakerName),
    studyHours: toNumber(values.studyHours),
    sleepTime: toNullable(values.sleepTime),
    wakeTime: toNullable(values.wakeTime),
    dayRestMinutes: toNumber(values.dayRestMinutes),
    totalRestMinutes: toNumber(values.totalRestMinutes),
    officeGoingTime: toNullable(values.officeGoingTime),
    officeReturnTime: toNullable(values.officeReturnTime),
    notes: toNullable(values.notes),
    signatureText: toNullable(values.signatureText),
  }
}

export function reportToFormValues(
  report: SadhanaReport,
): SadhanaReportFormInput {
  return {
    reportDate: report.reportDate,
    roundsBefore430: String(report.roundsBefore430),
    roundsTill7am: String(report.roundsTill7am),
    lastRoundTime: report.lastRoundTime ?? '',
    totalRounds: String(report.totalRounds),
    readingMinutes: String(report.readingMinutes),
    bookName: report.bookName ?? '',
    hearingMinutes: String(report.hearingMinutes),
    speakerName: report.speakerName ?? '',
    studyHours: String(report.studyHours ?? 0),
    sleepTime: report.sleepTime ?? '',
    wakeTime: report.wakeTime ?? '',
    dayRestMinutes: String(report.dayRestMinutes),
    totalRestMinutes: String(report.totalRestMinutes),
    officeGoingTime: report.officeGoingTime ?? '',
    officeReturnTime: report.officeReturnTime ?? '',
    notes: report.notes ?? '',
    signatureText: report.signatureText ?? '',
  }
}

export function emptyFormValues(reportDate: string): SadhanaReportFormInput {
  return {
    reportDate,
    roundsBefore430: '',
    roundsTill7am: '',
    lastRoundTime: '',
    totalRounds: '',
    readingMinutes: '',
    bookName: '',
    hearingMinutes: '',
    speakerName: '',
    studyHours: '',
    sleepTime: '',
    wakeTime: '',
    dayRestMinutes: '',
    totalRestMinutes: '',
    officeGoingTime: '',
    officeReturnTime: '',
    notes: '',
    signatureText: '',
  }
}
