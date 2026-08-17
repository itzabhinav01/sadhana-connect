import { useLocation } from 'react-router-dom'

import { AuthCard } from '@/presentation/pages/auth/AuthCard'

// Not part of the current registration flow — email confirmation is
// disabled for the pilot, so RegisterPage never navigates here. Route and
// component are kept (not deleted) so re-enabling email confirmation later
// only requires restoring the navigate() call in RegisterPage, not rebuilding
// this page.
export function CheckEmailPage() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  return (
    <AuthCard
      title="Check your email"
      description="Confirm your email to finish creating your account."
    >
      <p className="text-sm text-muted-foreground">
        We&apos;ve sent a confirmation link{email ? ` to ${email}` : ''}. Open
        it to activate your account, then come back and sign in.
      </p>
    </AuthCard>
  )
}
