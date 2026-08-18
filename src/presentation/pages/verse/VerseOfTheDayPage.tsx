import { useVerseOfTheDay } from '@/application/verse/use-verse-of-the-day'
import { VerseCitationCard } from '@/presentation/pages/verse/VerseCitationCard'

export function VerseOfTheDayPage() {
  const verseQuery = useVerseOfTheDay()

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Verse of the Day
        </h1>
        <p className="text-muted-foreground">
          A daily citation from Bhagavad-gītā As It Is, linked to VedaBase
          for the full translation and purport.
        </p>
      </div>

      {verseQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {verseQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading today&apos;s verse. Please try again.
        </p>
      ) : null}

      {verseQuery.isSuccess && verseQuery.data === null ? (
        <p className="text-sm text-muted-foreground">
          Today&apos;s verse is not available yet.
        </p>
      ) : null}

      {verseQuery.isSuccess && verseQuery.data ? (
        <VerseCitationCard verse={verseQuery.data} />
      ) : null}
    </div>
  )
}
