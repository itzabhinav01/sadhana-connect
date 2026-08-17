import { RecentReportsList } from '@/presentation/pages/dashboard/RecentReportsList'
import { TodaySadhanaCard } from '@/presentation/pages/dashboard/TodaySadhanaCard'
import { WeeklyRoundsChart } from '@/presentation/pages/dashboard/WeeklyRoundsChart'
import { WeeklySummaryCard } from '@/presentation/pages/dashboard/WeeklySummaryCard'

// Each card owns its own query/loading/error state independently — a
// slow or failed chart must never block the Today card, which is the
// one thing every devotee opens this page to see/act on.
export function DevoteeDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Your sadhana at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <TodaySadhanaCard />
          <WeeklyRoundsChart />
        </div>
        <div className="flex flex-col gap-6">
          <WeeklySummaryCard />
          <RecentReportsList />
        </div>
      </div>
    </div>
  )
}
