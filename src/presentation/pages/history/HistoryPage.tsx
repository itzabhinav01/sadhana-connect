import { useState } from 'react'

import {
  HistoryFilterBar,
  type HistoryDateFilters,
} from '@/presentation/pages/history/HistoryFilterBar'
import { HistoryReportList } from '@/presentation/pages/history/HistoryReportList'

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryDateFilters>({
    fromDate: '',
    toDate: '',
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Sadhana History
        </h1>
        <p className="text-muted-foreground">
          Browse your past sadhana reports.
        </p>
      </div>

      <HistoryFilterBar filters={filters} onChange={setFilters} />

      <HistoryReportList
        fromDate={filters.fromDate || undefined}
        toDate={filters.toDate || undefined}
      />
    </div>
  )
}
