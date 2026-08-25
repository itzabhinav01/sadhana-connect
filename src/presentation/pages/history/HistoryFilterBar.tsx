import { Button } from '@/presentation/components/ui/button'
import { DateRangeInputs } from '@/presentation/components/shared/DateRangeInputs'
import { addDaysIso, getLocalDateIso } from '@sadhana-connect/shared'

export interface HistoryDateFilters {
  fromDate: string
  toDate: string
}

interface HistoryFilterBarProps {
  filters: HistoryDateFilters
  onChange: (filters: HistoryDateFilters) => void
}

// Blank fromDate = no lower bound. Blank toDate = local today (enforced
// again, independently, in useSadhanaHistory — this is just the UI's
// starting point, not the source of truth for that cap).
export function HistoryFilterBar({ filters, onChange }: HistoryFilterBarProps) {
  const today = getLocalDateIso()

  const applyQuickFilter = (days: number | null) => {
    if (days === null) {
      onChange({ fromDate: '', toDate: '' })
      return
    }
    onChange({ fromDate: addDaysIso(today, -(days - 1)), toDate: '' })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <DateRangeInputs
        idPrefix="history"
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onFromDateChange={(fromDate) => onChange({ ...filters, fromDate })}
        onToDateChange={(toDate) => onChange({ ...filters, toDate })}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter(30)}
        >
          Last 30 days
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter(90)}
        >
          Last 90 days
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter(null)}
        >
          All time
        </Button>
      </div>
    </div>
  )
}
