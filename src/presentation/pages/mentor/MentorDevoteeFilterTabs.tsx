import {
  MENTOR_DEVOTEE_FILTERS,
  type MentorDevoteeFilter,
} from '@/application/mentor/mentor-devotee-filter'
import { Button } from '@/presentation/components/ui/button'

const FILTER_LABELS: Record<MentorDevoteeFilter, string> = {
  all: 'All',
  submitted: 'Submitted Today',
  pending: 'Pending Today',
}

interface MentorDevoteeFilterTabsProps {
  filter: MentorDevoteeFilter
  onFilterChange: (filter: MentorDevoteeFilter) => void
}

export function MentorDevoteeFilterTabs({
  filter,
  onFilterChange,
}: MentorDevoteeFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter devotees"
      className="flex flex-wrap gap-2"
    >
      {MENTOR_DEVOTEE_FILTERS.map((option) => (
        <Button
          key={option}
          type="button"
          role="tab"
          aria-selected={filter === option}
          variant={filter === option ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(option)}
        >
          {FILTER_LABELS[option]}
        </Button>
      ))}
    </div>
  )
}
