import { useProfile } from '@sadhana-connect/auth'
import { Redirect } from 'expo-router'

import { LoadingScreen } from '../../src/presentation/components/LoadingScreen'

const ROLE_HOME: Record<string, '/devotee' | '/mentor' | '/admin'> = {
  devotee: '/devotee',
  mentor: '/mentor',
  super_admin: '/admin',
}

// This screen only ever renders while (app)/_layout.tsx has already
// confirmed profile.data exists and is active — the loading state below is
// a defensive fallback, not the expected path.
export default function AppIndex() {
  const profile = useProfile()

  if (!profile.data) {
    return <LoadingScreen />
  }

  return <Redirect href={ROLE_HOME[profile.data.role]} />
}
