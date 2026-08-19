import { useState } from 'react'

import { useGenerateRecoveryLink } from '@/application/admin/use-generate-recovery-link'
import { Button } from '@/presentation/components/ui/button'

interface AdminUserPasswordResetProps {
  targetUserId: string
}

// The link lives only in this component's local state, for exactly as
// long as the modal is open. Closing the modal (handleClose) discards it —
// never written to TanStack Query's cache, localStorage, or any table.
export function AdminUserPasswordReset({ targetUserId }: AdminUserPasswordResetProps) {
  const generateLink = useGenerateRecoveryLink()
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleClose() {
    setLink(null)
    setCopied(false)
    generateLink.reset()
  }

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">Password reset</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => generateLink.mutate(targetUserId, { onSuccess: setLink })}
        disabled={generateLink.isPending}
        className="self-start"
      >
        {generateLink.isPending ? 'Generating…' : 'Generate recovery link'}
      </Button>
      {generateLink.isError ? (
        <p className="text-xs text-destructive">Could not generate a recovery link.</p>
      ) : null}

      {link ? (
        <div
          role="dialog"
          aria-label="One-time recovery link"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border bg-background p-4">
            <p className="text-sm font-medium text-foreground">One-time recovery link</p>
            <p className="text-xs text-destructive">
              This link logs in as this user. Share it only through a secure private channel — do
              not screenshot or post it publicly. It is shown once and will not be saved anywhere.
            </p>
            <p className="break-all rounded-md border bg-muted p-2 text-xs text-foreground">
              {link}
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy link'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
