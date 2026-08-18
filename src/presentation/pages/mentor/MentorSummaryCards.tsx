import type { MentorDevoteeSummary } from '@/application/mentor/mentor-devotee-summary'
import { Card, CardContent, CardHeader } from '@/presentation/components/ui/card'

interface MentorSummaryCardsProps {
  summaries: MentorDevoteeSummary[]
}

export function MentorSummaryCards({ summaries }: MentorSummaryCardsProps) {
  const totalAssigned = summaries.length
  const submittedToday = summaries.filter((s) => s.hasSubmittedToday).length
  const pendingToday = totalAssigned - submittedToday

  const cards = [
    { label: 'Total Assigned', value: totalAssigned },
    { label: 'Submitted Today', value: submittedToday },
    { label: 'Pending Today', value: pendingToday },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
