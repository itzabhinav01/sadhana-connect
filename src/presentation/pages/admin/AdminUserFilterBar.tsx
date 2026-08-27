import type { AdminUserFilters, AppRole } from '@sadhana-connect/domain'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'

interface AdminUserFilterBarProps {
  filters: AdminUserFilters
  onChange: (filters: AdminUserFilters) => void
}

// "all" is a sentinel, not a real AppRole/status value — Radix's Select
// disallows an item with an empty-string value (that's reserved
// internally for "no selection"), so the reset-to-unfiltered option
// needs its own non-empty value, translated back to undefined here.
const ROLE_ALL = 'all'
const STATUS_ALL = 'all'

export function AdminUserFilterBar({ filters, onChange }: AdminUserFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="admin-user-search" className="text-sm font-medium text-foreground">
          Search by name
        </label>
        <Input
          id="admin-user-search"
          value={filters.search ?? ''}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Full name…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="admin-user-role" className="text-sm font-medium text-foreground">
          Role
        </label>
        <Select
          value={filters.role ?? ROLE_ALL}
          onValueChange={(value) =>
            onChange({
              ...filters,
              role: value === ROLE_ALL ? undefined : (value as AppRole),
            })
          }
        >
          <SelectTrigger id="admin-user-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ROLE_ALL}>All roles</SelectItem>
            <SelectItem value="devotee">Devotee</SelectItem>
            <SelectItem value="mentor">Mentor</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="admin-user-status" className="text-sm font-medium text-foreground">
          Status
        </label>
        <Select
          value={filters.status ?? STATUS_ALL}
          onValueChange={(value) =>
            onChange({
              ...filters,
              status: value === STATUS_ALL ? undefined : (value as AdminUserFilters['status']),
            })
          }
        >
          <SelectTrigger id="admin-user-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
