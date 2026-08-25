import { useEffect, useRef, useState } from 'react'

import {
  AUTHOR_NAME,
  formatVerseCitation,
  formatVerseCitationForCopy,
} from '@sadhana-connect/verse'
import type { VerseOfTheDay } from '@sadhana-connect/domain/entities/verse-of-the-day'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent } from '@/presentation/components/ui/card'

interface VerseCitationCardProps {
  verse: VerseOfTheDay
}

const COPIED_RESET_MS = 2000

export function VerseCitationCard({ verse }: VerseCitationCardProps) {
  const [copied, setCopied] = useState(false)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatVerseCitationForCopy(verse))
      setCopied(true)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    } catch {
      // Clipboard access can be denied or unsupported — the citation and
      // the VedaBase link remain visible on the page either way.
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardContent className="flex flex-col items-center gap-4 py-2 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          {formatVerseCitation(verse)}
        </h2>
        <p className="text-sm text-muted-foreground">{AUTHOR_NAME}</p>

        {verse.content ? (
          <div className="flex w-full flex-col gap-4 text-left">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sanskrit
              </h3>
              <p className="mt-1 whitespace-pre-line font-serif italic leading-relaxed text-foreground">
                {verse.content.sanskritTransliteration}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Translation
              </h3>
              <p className="mt-1 max-w-prose leading-relaxed text-foreground">
                {verse.content.translation}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <a href={verse.sourceUrl} target="_blank" rel="noopener noreferrer">
              Read on VedaBase
            </a>
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy Citation'}
          </Button>
        </div>
        <p aria-live="polite" className="sr-only">
          {copied ? 'Citation copied to clipboard' : ''}
        </p>
      </CardContent>
    </Card>
  )
}
