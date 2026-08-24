import { useState } from 'react'

import { useAdminUsers } from '@/application/admin/use-admin-users'
import type { AdminUserFilters } from '@sadhana-connect/domain/repositories/admin-user-repository'
import { Button } from '@/presentation/components/ui/button'
import { AdminUserFilterBar } from '@/presentation/pages/admin/AdminUserFilterBar'
import { AdminUserList } from '@/presentation/pages/admin/AdminUserList'

export function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUserFilters>({})
  const usersQuery = useAdminUsers(filters)

  const users = usersQuery.data?.pages.flatMap((page) => page.users) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-muted-foreground">
          Every devotee, mentor, and super admin on the platform.
        </p>
      </div>

      <AdminUserFilterBar filters={filters} onChange={setFilters} />

      {usersQuery.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      {usersQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading users. Please try again.
        </p>
      ) : null}

      {usersQuery.isSuccess && users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users match these filters.</p>
      ) : null}

      {users.length > 0 ? <AdminUserList users={users} /> : null}

      {usersQuery.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => usersQuery.fetchNextPage()}
          disabled={usersQuery.isFetchingNextPage}
          className="self-center"
        >
          {usersQuery.isFetchingNextPage ? 'Loading more…' : 'Load more'}
        </Button>
      ) : null}
    </div>
  )
}
