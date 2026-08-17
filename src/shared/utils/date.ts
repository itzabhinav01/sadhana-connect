// Local calendar date as 'YYYY-MM-DD', from the browser's own timezone —
// never UTC. Using UTC here would put users east of Greenwich into
// "tomorrow" for several hours every day.
export function getLocalDateIso(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
