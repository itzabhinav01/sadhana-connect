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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ label, key }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle>
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{summary[key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
