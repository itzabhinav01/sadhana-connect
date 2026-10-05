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
  const last30From = addDaysIso(today, -29)
  const last90From = addDaysIso(today, -89)

  const isLast30Active = filters.fromDate === last30From && filters.toDate === ''
  const isLast90Active = filters.fromDate === last90From && filters.toDate === ''
  const isAllTimeActive = filters.fromDate === '' && filters.toDate === ''

  const applyQuickFilter = (days: number | null) => {
    if (days === null) {
      onChange({ fromDate: '', toDate: '' })
      return
    }
    onChange({ fromDate: addDaysIso(today, -(days - 1)), toDate: '' })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <DateRangeInputs
        idPrefix="history"
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onFromDateChange={(fromDate) => onChange({ ...filters, fromDate })}
        onToDateChange={(toDate) => onChange({ ...filters, toDate })}
      />

      <div className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/60 p-1">
        <Button
          type="button"
          variant={isLast30Active ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => applyQuickFilter(30)}
        >
          Last 30 days
        </Button>
        <Button
          type="button"
          variant={isLast90Active ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => applyQuickFilter(90)}
        >
          Last 90 days
        </Button>
        <Button
          type="button"
          variant={isAllTimeActive ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => applyQuickFilter(null)}
        >
          All time
        </Button>
      </div>
    </div>
  )
}
