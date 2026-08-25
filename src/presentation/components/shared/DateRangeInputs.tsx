import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { getLocalDateIso } from '@sadhana-connect/shared'

interface DateRangeInputsProps {
  fromDate: string
  toDate: string
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
  // Distinguishes the input ids when more than one instance could exist
  // in the DOM (different pages today, but ids should still be unique).
  idPrefix: string
}

// Shared by HistoryFilterBar and AnalyticsRangeSelector — the paired
// "From"/"To" date inputs, always capped at local today. Callers own
// their own quick-filter buttons and semantics (e.g. History's blank =
// unbounded vs. Analytics' required custom range); this component only
// renders the two inputs themselves.
export function DateRangeInputs({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  idPrefix,
}: DateRangeInputsProps) {
  const today = getLocalDateIso()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-from-date`}>From</Label>
        <Input
          id={`${idPrefix}-from-date`}
          type="date"
          max={today}
          value={fromDate}
          onChange={(event) => onFromDateChange(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-to-date`}>To</Label>
        <Input
          id={`${idPrefix}-to-date`}
          type="date"
          max={today}
          value={toDate}
          onChange={(event) => onToDateChange(event.target.value)}
        />
      </div>
    </div>
  )
}
