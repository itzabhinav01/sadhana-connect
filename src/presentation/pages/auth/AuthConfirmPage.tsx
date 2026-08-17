import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useConfirmEmail } from '@/application/auth/use-confirm-email'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import { AuthCard } from '@/presentation/pages/auth/AuthCard'

export function AuthConfirmPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const confirmEmail = useConfirmEmail()
  const hasAttempted = useRef(false)

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  useEffect(() => {
    if (hasAttempted.current) return
    if (!tokenHash || !type) return

    hasAttempted.current = true

    confirmEmail.mutate(
      { tokenHash, type },
      { onSuccess: () => navigate('/', { replace: true }) },
    )
  }, [tokenHash, type, confirmEmail, navigate])

  if (!tokenHash || !type) {
    return (
      <AuthCard
        title="Confirmation link invalid"
        description="This confirmation link is missing required information."
      >
        <Alert variant="destructive">
          <AlertDescription>
            The link you followed is incomplete. Please use the link from
            your confirmation email, or request a new one.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center text-sm">
          <Link to="/register" className="underline underline-offset-4">
            Back to registration
          </Link>
        </div>
      </AuthCard>
    )
  }

  if (confirmEmail.isError) {
    return (
      <AuthCard
        title="Confirmation failed"
        description="We couldn't confirm your email."
      >
        <Alert variant="destructive">
          <AlertDescription>
            This link may have expired or already been used. Please try
            signing in, or register again.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="underline underline-offset-4">
            Go to sign in
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Confirming your email" description="One moment please.">
      <p className="text-sm text-muted-foreground">
        Verifying your confirmation link…
      </p>
    </AuthCard>
  )
}
