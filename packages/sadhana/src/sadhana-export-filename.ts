export type SadhanaExportExtension = 'pdf' | 'txt' | 'csv'

// reportDate/fromDate/toDate are always already-local 'YYYY-MM-DD'
// strings (report.reportDate, or a History filter date) — no Date object
// is constructed here, so there is no UTC-shift risk at all.
export function buildSadhanaSingleExportFilename(
  reportDate: string,
  extension: SadhanaExportExtension,
): string {
  return `Sadhana-${reportDate}.${extension}`
}

export function buildSadhanaRangeExportFilename(
  fromDate: string,
  toDate: string,
  extension: SadhanaExportExtension,
): string {
  return `Sadhana-${fromDate}-to-${toDate}.${extension}`
}
