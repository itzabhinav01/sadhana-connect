import type { AdminDashboardSummary } from '@sadhana-connect/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'

interface AdminSummaryCardsProps {
  summary: AdminDashboardSummary
}

const CARDS: { label: string; key: keyof AdminDashboardSummary }[] = [
  { label: 'Total devotees', key: 'totalDevotees' },
  { label: 'Total mentors', key: 'totalMentors' },
  { label: 'Active accounts', key: 'activeCount' },
  { label: 'Disabled accounts', key: 'disabledCount' },
  { label: 'Deleted accounts', key: 'anonymizedCount' },
  { label: 'Temple groups', key: 'totalTempleGroups' },
  { label: 'Devotees without a mentor', key: 'devoteesWithoutActiveMentor' },
  { label: "Reports submitted today", key: 'reportsSubmittedToday' },
]

export function AdminSummaryCards({ summary }: AdminSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {CARDS.map(({ label, key }) => (
        <Card key={key} className="gap-2 py-4 sm:gap-4 sm:py-5">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-2xl font-bold tabular-nums text-foreground">{summary[key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
