import { useSearchParams } from 'react-router-dom'

import { useSadhanaReport } from '@sadhana-connect/sadhana'
import { getLocalDateIso } from '@sadhana-connect/shared'
import { SadhanaReportForm } from '@/presentation/pages/sadhana/SadhanaReportForm'

function isValidDateParam(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function parsePrefillRoundsParam(value: string | null): number | undefined {
  if (value === null) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

// The date lives in the URL (?date=YYYY-MM-DD), not local component
// state — this is what lets the dashboard's "Recent reports" list link
// straight to a specific date's report. ?prefillRounds= (Phase 10, from
// the Japa Counter) works the same way — read once at this level, not
// tracked as ongoing state.
export function SadhanaFormPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const date = isValidDateParam(dateParam) ? dateParam : getLocalDateIso()
  const prefillRounds = parsePrefillRoundsParam(
    searchParams.get('prefillRounds'),
  )
  const reportQuery = useSadhanaReport(date)

  const handleDateChange = (nextDate: string) => {
    setSearchParams(
      nextDate === getLocalDateIso() ? {} : { date: nextDate },
      { replace: true },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Daily Sadhana
        </h1>
        <p className="text-muted-foreground">
          Record your sadhana for the selected date.
        </p>
      </div>

      {reportQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {reportQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your sadhana report. Please try
          again.
        </p>
      ) : null}

      {reportQuery.isSuccess ? (
        <SadhanaReportForm
          key={date}
          date={date}
          existingReport={reportQuery.data}
          onDateChange={handleDateChange}
          prefillRounds={prefillRounds}
        />
      ) : null}
    </div>
  )
}
