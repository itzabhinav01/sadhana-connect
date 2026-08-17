import type { SadhanaDateRange } from '@/application/sadhana/sadhana-date-range'
import { Button } from '@/presentation/components/ui/button'
import { DateRangeInputs } from '@/presentation/components/shared/DateRangeInputs'

export type AnalyticsRangeOption = '7' | '30' | '90' | 'custom'

interface AnalyticsRangeSelectorProps {
  option: AnalyticsRangeOption
  customRange: SadhanaDateRange
  error: string | null
  onOptionChange: (option: AnalyticsRangeOption) => void
  onCustomRangeChange: (range: SadhanaDateRange) => void
}

const QUICK_OPTIONS: { value: AnalyticsRangeOption; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom' },
]

export function AnalyticsRangeSelector({
  option,
  customRange,
  error,
  onOptionChange,
  onCustomRangeChange,
}: AnalyticsRangeSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((quickOption) => (
          <Button
            key={quickOption.value}
            type="button"
            variant={option === quickOption.value ? 'default' : 'outline'}
            size="sm"
            aria-pressed={option === quickOption.value}
            onClick={() => onOptionChange(quickOption.value)}
          >
            {quickOption.label}
          </Button>
        ))}
      </div>

      {option === 'custom' ? (
        <DateRangeInputs
          idPrefix="analytics"
          fromDate={customRange.fromDate}
          toDate={customRange.toDate}
          onFromDateChange={(fromDate) =>
            onCustomRangeChange({ ...customRange, fromDate })
          }
          onToDateChange={(toDate) =>
            onCustomRangeChange({ ...customRange, toDate })
          }
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
