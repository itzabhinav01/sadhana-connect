import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

// Suspense fallback for a lazy-loaded chart card (Phase 20 — recharts is
// code-split out of the initial bundle). Matches the real chart's own
// Card/h-56 layout exactly so nothing shifts when the chart replaces it.
export function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="status"
          aria-label={`Loading ${title} chart`}
          className="h-56 w-full animate-pulse rounded-md bg-muted"
        />
      </CardContent>
    </Card>
  )
}
