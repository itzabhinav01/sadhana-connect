// Local calendar date as 'YYYY-MM-DD', from the browser's own timezone —
// never UTC. Using UTC here would put users east of Greenwich into
// "tomorrow" for several hours every day.
export function getLocalDateIso(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Adds (or subtracts, for negative `days`) whole calendar days to a
// 'YYYY-MM-DD' string, staying in local time throughout — building a
// `Date` via `new Date('YYYY-MM-DD')` parses as UTC midnight in most
// engines, which silently shifts the result by a day in some timezones.
// Constructing from the individual Y/M/D components avoids that.
export function addDaysIso(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return getLocalDateIso(date)
}

// Every calendar date from fromDate to toDate, inclusive. Callers use
// this to build a fixed-length day list before left-joining sparse
// report data onto it — the list's length must come from the date range
// itself, never from however many rows a query happened to return.
export function buildDateRangeList(fromDate: string, toDate: string): string[] {
  const days: string[] = []
  for (let date = fromDate; date <= toDate; date = addDaysIso(date, 1)) {
    days.push(date)
  }
  return days
}

// Days since the Unix epoch for a 'YYYY-MM-DD' string, computed from the
// date's own Y/M/D components via Date.UTC rather than local-timezone
// parsing — so the same date string always maps to the same day number no
// matter which timezone the caller is running in. Used to deterministically
// rotate through a dataset by date (Verse of the Day selection).
export function daysSinceEpoch(dateIso: string): number {
  const [year, month, day] = dateIso.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}
