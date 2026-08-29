import type { SadhanaReport } from '@sadhana-connect/domain'
import type { UpsertSadhanaReportParams } from '@sadhana-connect/domain'
import type { SadhanaReportFormInput } from './sadhana-report-schema'

function toInt(value: string): number {
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
    roundsBefore430: toInt(values.roundsBefore430),
    roundsTill7am: toInt(values.roundsTill7am),
    lastRoundTime: toNullable(values.lastRoundTime),
    totalRounds: toInt(values.totalRounds),
    readingMinutes: toInt(values.readingMinutes),
    bookName: toNullable(values.bookName),
    hearingMinutes: toInt(values.hearingMinutes),
    speakerName: toNullable(values.speakerName),
    sleepTime: toNullable(values.sleepTime),
    wakeTime: toNullable(values.wakeTime),
    dayRestMinutes: toInt(values.dayRestMinutes),
    totalRestMinutes: toInt(values.totalRestMinutes),
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
