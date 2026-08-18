import { useState } from 'react'
import type { ChangeEvent } from 'react'

import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'

interface JapaControlsProps {
  target: number
  canUndo: boolean
  onUndo: () => void
  onReset: () => void
  onTargetChange: (target: number) => void
}

// Reset uses an inline two-step confirm (not a modal) — this app has no
// Dialog/AlertDialog primitive yet, and a single confirmation doesn't
// warrant introducing one.
export function JapaControls({
  target,
  canUndo,
  onUndo,
  onReset,
  onTargetChange,
}: JapaControlsProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [targetInput, setTargetInput] = useState(String(target))

  // Adjusts state during render when `target` changes externally (e.g.
  // cross-tab sync) — React's documented pattern for this, rather than
  // an effect that would set state one render late.
  const [syncedTarget, setSyncedTarget] = useState(target)
  if (target !== syncedTarget) {
    setSyncedTarget(target)
    setTargetInput(String(target))
  }

  const handleReset = () => {
    onReset()
    setConfirmingReset(false)
  }

  const handleTargetChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setTargetInput(value)

    const parsed = Number(value)
    if (value !== '' && Number.isInteger(parsed) && parsed > 0) {
      onTargetChange(parsed)
    }
  }

  const handleTargetBlur = () => {
    const parsed = Number(targetInput)
    const isValid = targetInput !== '' && Number.isInteger(parsed) && parsed > 0
    if (!isValid) {
      setTargetInput(String(target))
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" onClick={onUndo} disabled={!canUndo}>
          Undo
        </Button>

        {confirmingReset ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Reset today&apos;s count?
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleReset}
            >
              Confirm
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingReset(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmingReset(true)}
          >
            Reset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="japa-target">Daily target (rounds)</Label>
        <Input
          id="japa-target"
          type="number"
          inputMode="numeric"
          min={1}
          className="w-20"
          value={targetInput}
          onChange={handleTargetChange}
          onBlur={handleTargetBlur}
        />
      </div>
    </div>
  )
}
