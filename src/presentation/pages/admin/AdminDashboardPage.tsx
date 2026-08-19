import { useAdminDashboardSummary } from '@/application/admin/use-admin-dashboard-summary'
import { AdminSummaryCards } from '@/presentation/pages/admin/AdminSummaryCards'

export function AdminDashboardPage() {
  const summaryQuery = useAdminDashboardSummary()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide summary.</p>
      </div>

      {summaryQuery.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      {summaryQuery.isError ? (
        <p className="text-sm text-destructive">Something went wrong loading the summary.</p>
      ) : null}

      {summaryQuery.data ? <AdminSummaryCards summary={summaryQuery.data} /> : null}
    </div>
  )
}
