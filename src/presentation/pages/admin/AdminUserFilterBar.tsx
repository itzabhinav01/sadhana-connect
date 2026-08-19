import type { AppRole } from '@/domain/entities/profile'
import type { AdminUserFilters } from '@/domain/repositories/admin-user-repository'
import { Input } from '@/presentation/components/ui/input'
import { Select } from '@/presentation/components/ui/select'

interface AdminUserFilterBarProps {
  filters: AdminUserFilters
  onChange: (filters: AdminUserFilters) => void
}

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
          id="admin-user-role"
          value={filters.role ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              role: (event.target.value || undefined) as AppRole | undefined,
            })
          }
        >
          <option value="">All roles</option>
          <option value="devotee">Devotee</option>
          <option value="mentor">Mentor</option>
          <option value="super_admin">Super Admin</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="admin-user-status" className="text-sm font-medium text-foreground">
          Status
        </label>
        <Select
          id="admin-user-status"
          value={filters.status ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              status: (event.target.value || undefined) as AdminUserFilters['status'],
            })
          }
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="anonymized">Deleted</option>
        </Select>
      </div>
    </div>
  )
}
