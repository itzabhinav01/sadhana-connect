import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/application/auth/use-auth'
import { useSignOut } from '@/application/auth/use-sign-out'
import { Button } from '@/presentation/components/ui/button'

export function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const signOut = useSignOut()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Sadhana Connect
      </h1>
      <p className="text-muted-foreground">
        Signed in as {session?.email ?? 'unknown user'}
      </p>
      <Button
        onClick={handleSignOut}
        disabled={signOut.isPending}
        variant="outline"
      >
        {signOut.isPending ? 'Signing out…' : 'Log out'}
      </Button>
    </main>
  )
}
