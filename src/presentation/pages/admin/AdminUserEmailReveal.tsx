import { useRevealUserEmail } from '@/application/admin/use-admin-user-email'
import { Button } from '@/presentation/components/ui/button'

interface AdminUserEmailRevealProps {
  targetUserId: string
}

// On-demand only — nothing here fetches until the button is clicked.
// The error text shown on failure is always the same fixed string,
// never the underlying error's message — the Edge Function's own error
// responses are already generic (see admin-account-actions/index.ts),
// but this component doesn't even trust that: it never reads
// revealEmail.error at all, so no backend/HTTP detail can leak into the
// UI even if that ever changed. Nothing here logs the email either — the
// only place it's read is the success-state render below.
export function AdminUserEmailReveal({ targetUserId }: AdminUserEmailRevealProps) {
  const revealEmail = useRevealUserEmail()

  if (revealEmail.data) {
    return <span className="text-sm text-foreground">{revealEmail.data}</span>
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => revealEmail.mutate(targetUserId)}
        disabled={revealEmail.isPending}
      >
        {revealEmail.isPending ? 'Loading…' : 'Reveal email'}
      </Button>
      {revealEmail.isError ? (
        <span className="text-xs text-destructive">Could not load email.</span>
      ) : null}
    </div>
  )
}
