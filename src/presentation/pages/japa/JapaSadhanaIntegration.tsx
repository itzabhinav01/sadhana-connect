import { useNavigate } from 'react-router-dom'

import { Button } from '@/presentation/components/ui/button'
import { getLocalDateIso } from '@/shared/utils/date'

interface JapaSadhanaIntegrationProps {
  completedRounds: number
}

// Navigates to the existing Sadhana form with the count pre-filled —
// never writes to Supabase directly. The devotee still explicitly
// reviews and signs before anything is saved (approved decision, Phase
// 10): the counter has no way to satisfy the report's required
// signature on its own, and shouldn't try to.
export function JapaSadhanaIntegration({
  completedRounds,
}: JapaSadhanaIntegrationProps) {
  const navigate = useNavigate()

  if (completedRounds === 0) return null

  const handleUseInSadhana = () => {
    const today = getLocalDateIso()
    navigate(`/sadhana?date=${today}&prefillRounds=${completedRounds}`)
  }

  return (
    <Button type="button" variant="outline" onClick={handleUseInSadhana}>
      Use today&apos;s completed rounds in Sadhana
    </Button>
  )
}
