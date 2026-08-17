import { useState } from 'react'

import { useSadhanaReport } from '@/application/sadhana/use-sadhana-report'
import { getLocalDateIso } from '@/shared/utils/date'
import { SadhanaReportForm } from '@/presentation/pages/sadhana/SadhanaReportForm'

export function SadhanaFormPage() {
  const [date, setDate] = useState(() => getLocalDateIso())
  const reportQuery = useSadhanaReport(date)

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
          onDateChange={setDate}
        />
      ) : null}
    </div>
  )
}
