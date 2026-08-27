import type { JapaProgress } from '@sadhana-connect/japa'
import { BEADS_PER_ROUND } from '@sadhana-connect/japa'

interface JapaTapButtonProps {
  progress: JapaProgress
  onTap: () => void
}

// A real <button> (native Enter/Space activation, focusable, visible
// focus ring) sized well beyond the minimum touch-target guideline —
// this is the single dominant element on the page.
export function JapaTapButton({ progress, onTap }: JapaTapButtonProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Tap to count. Round ${progress.currentRound}, bead ${progress.currentBead} of ${BEADS_PER_ROUND}.`}
      className="flex size-56 shrink-0 select-none flex-col items-center justify-center gap-1 rounded-full border-4 border-primary bg-primary/10 text-primary shadow-lg outline-none transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-ring"
    >
      <span aria-hidden="true" className="text-5xl font-bold">
        {progress.currentBead}
      </span>
      <span aria-hidden="true" className="text-sm text-muted-foreground">
        of {BEADS_PER_ROUND}
      </span>
    </button>
  )
}
