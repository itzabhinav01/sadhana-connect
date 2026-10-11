import { BookOpen, CheckCircle2, ChevronRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useDevoteeBookProgress } from '@sadhana-connect/books'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'

interface PrabhupadaBooksProgressCardProps {
  profileId?: string | null
}

export function PrabhupadaBooksProgressCard({ profileId }: PrabhupadaBooksProgressCardProps = {}) {
  const { data, isLoading } = useDevoteeBookProgress(profileId)

  const summary = data?.summary ?? {
    total: 36,
    completed: 0,
    reading: 0,
    notStarted: 36,
    completionPercentage: 0,
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Prabhupada Books</CardTitle>
              <p className="text-xs text-muted-foreground">Reading Journey</p>
            </div>
          </div>
          <span className="text-xl font-black text-primary">
            {summary.completionPercentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${summary.completionPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{summary.completed} done</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{summary.reading} reading</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <span>{summary.notStarted} to read</span>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full justify-between text-xs font-semibold"
        >
          <Link to="/profile#books">
            <span>{isLoading ? 'Loading...' : 'Update Reading Progress'}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
