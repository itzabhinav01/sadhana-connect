import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { addDaysIso, getLocalDateIso } from '@/shared/utils/date'

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="history-from-date">From</Label>
          <Input
            id="history-from-date"
            type="date"
            max={today}
            value={filters.fromDate}
            onChange={(event) =>
              onChange({ ...filters, fromDate: event.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="history-to-date">To</Label>
          <Input
            id="history-to-date"
            type="date"
            max={today}
            value={filters.toDate}
            onChange={(event) =>
              onChange({ ...filters, toDate: event.target.value })
            }
          />
        </div>
      </div>

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
