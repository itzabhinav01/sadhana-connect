import type { JapaProgress } from '@sadhana-connect/japa'

interface JapaProgressDisplayProps {
  progress: JapaProgress
}

// Deliberately no celebratory animation on target completion — just a
// quiet, legible state change, matching the app's devotional tone.
export function JapaProgressDisplay({ progress }: JapaProgressDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-sm text-muted-foreground">
        Round {progress.currentRound}
      </p>
      <p className="text-lg font-semibold text-foreground">
        {progress.completedRounds} of {progress.targetRounds} rounds today
        {progress.targetReached ? ' — target reached' : ''}
      </p>
    </div>
  )
}
