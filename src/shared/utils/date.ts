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
