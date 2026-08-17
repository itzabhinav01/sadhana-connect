import { useNavigate } from 'react-router-dom'

import { useSignOut } from '@/application/auth/use-sign-out'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

export function AccountDisabledPage() {
  const navigate = useNavigate()
  const signOut = useSignOut()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Account disabled</CardTitle>
          <CardDescription>
            Your account has been disabled. Please contact your temple
            administrator for assistance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSignOut}
            disabled={signOut.isPending}
            variant="outline"
          >
            {signOut.isPending ? 'Signing out…' : 'Log out'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
