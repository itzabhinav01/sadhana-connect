import type { MentorDevoteeSummary } from '@sadhana-connect/mentor'
import { Card, CardContent, CardHeader } from '@/presentation/components/ui/card'

interface MentorSummaryCardsProps {
  summaries: MentorDevoteeSummary[]
}

export function MentorSummaryCards({ summaries }: MentorSummaryCardsProps) {
  const totalAssigned = summaries.length
  const submittedYesterday = summaries.filter((s) => s.hasSubmittedYesterday).length
  const pendingYesterday = totalAssigned - submittedYesterday

  const cards = [
    { label: 'Total Assigned', value: totalAssigned },
    { label: 'Submitted Yesterday', value: submittedYesterday },
    { label: 'Pending Yesterday', value: pendingYesterday },
  ]

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="gap-2 py-3.5 sm:gap-4 sm:py-5">
          <CardHeader className="px-3.5 sm:px-6">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              {card.label}
            </p>
          </CardHeader>
          <CardContent className="px-3.5 sm:px-6">
            <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
