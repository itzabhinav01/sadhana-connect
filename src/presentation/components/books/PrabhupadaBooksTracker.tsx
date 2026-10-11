import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
} from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import {
  type BookReadingStatus,
  type BookWithProgress,
  useDevoteeBookProgress,
  useUpdateBookProgress,
} from '@sadhana-connect/books'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'

interface PrabhupadaBooksTrackerProps {
  profileId: string | null | undefined
  editable?: boolean
  title?: string
}

type FilterTab = 'all' | 'completed' | 'reading' | 'not_started'

export function PrabhupadaBooksTracker({
  profileId,
  editable = false,
  title = 'Prabhupada Books Reading Tracker',
}: PrabhupadaBooksTrackerProps) {
  const searchInputId = useId()
  const { data, isLoading } = useDevoteeBookProgress(profileId)
  const updateMutation = useUpdateBookProgress()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')

  const books = data?.booksWithProgress ?? []
  const summary = data?.summary ?? {
    total: 36,
    completed: 0,
    reading: 0,
    notStarted: 36,
    completionPercentage: 0,
  }

  const filteredBooks = useMemo(() => {
    return books.filter((book: BookWithProgress) => {
      const matchesSearch = book.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())
      const matchesTab =
        filterTab === 'all' ? true : book.status === filterTab
      return matchesSearch && matchesTab
    })
  }, [books, searchQuery, filterTab])

  const handleStatusChange = (bookId: number, newStatus: BookReadingStatus) => {
    if (!editable) return
    updateMutation.mutate({ bookId, status: newStatus })
  }

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Track reading of 36 canonical Srila Prabhupada books in recommended sequence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-primary">
              {summary.completionPercentage}%
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Completed
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${summary.completionPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>{summary.completed} Completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span>{summary.reading} Reading</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="h-3 w-3 rounded-full border border-muted-foreground/40" />
              <span>{summary.notStarted} To Read</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {editable ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id={searchInputId}
                type="search"
                role="searchbox"
                placeholder="Search books by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant={filterTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('all')}
              className="h-8 text-xs font-semibold"
            >
              All ({books.length || 36})
            </Button>
            <Button
              type="button"
              variant={filterTab === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('completed')}
              className="h-8 text-xs font-semibold"
            >
              Completed ({summary.completed})
            </Button>
            <Button
              type="button"
              variant={filterTab === 'reading' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('reading')}
              className="h-8 text-xs font-semibold"
            >
              Reading ({summary.reading})
            </Button>
            <Button
              type="button"
              variant={filterTab === 'not_started' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTab('not_started')}
              className="h-8 text-xs font-semibold"
            >
              To Read ({summary.notStarted})
            </Button>
          </div>
        </div>

        {/* Book items list */}
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading Prabhupada books...
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No books found matching your filter
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border">
            {filteredBooks.map((book: BookWithProgress) => (
              <div
                key={book.id}
                className="flex flex-col gap-3 p-3.5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {book.sequenceNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {book.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {book.readingUrl && (
                        <a
                          href={book.readingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Read Online <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {editable ? (
                    <div className="inline-flex rounded-lg border bg-muted/30 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(book.id, 'not_started')}
                        className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                          book.status === 'not_started'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        To Read
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(book.id, 'reading')}
                        className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                          book.status === 'reading'
                            ? 'bg-amber-500 text-white shadow-sm dark:bg-amber-600'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Reading
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(book.id, 'completed')}
                        className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                          book.status === 'completed'
                            ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  ) : (
                    <div>
                      {book.status === 'completed' && (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-xs font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </Badge>
                      )}
                      {book.status === 'reading' && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 gap-1 text-xs font-semibold">
                          <Clock className="h-3 w-3" /> Reading
                        </Badge>
                      )}
                      {book.status === 'not_started' && (
                        <Badge variant="secondary" className="text-muted-foreground text-xs font-medium">
                          To Read
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
