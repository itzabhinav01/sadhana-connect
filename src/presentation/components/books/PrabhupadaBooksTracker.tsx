import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Search,
} from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import {
  type BookReadingStatus,
  type BookWithProgress,
  PRABHUPADA_BOOKS_LIST,
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
  defaultExpanded?: boolean
}

type FilterTab = 'all' | 'completed' | 'reading' | 'not_started'

export function PrabhupadaBooksTracker({
  profileId,
  editable = false,
  title = 'Prabhupada Books Reading Tracker',
  defaultExpanded = false,
}: PrabhupadaBooksTrackerProps) {
  const searchInputId = useId()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { data, isLoading } = useDevoteeBookProgress(profileId)
  const updateMutation = useUpdateBookProgress(profileId)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')

  const fallbackBooks: BookWithProgress[] = useMemo(
    () =>
      (PRABHUPADA_BOOKS_LIST ?? []).map((b) => ({
        ...b,
        status: 'not_started' as BookReadingStatus,
        completedAt: null,
      })),
    [],
  )

  const books =
    data?.booksWithProgress && data.booksWithProgress.length > 0
      ? data.booksWithProgress
      : fallbackBooks
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
    updateMutation.mutate({ bookId, status: newStatus, profileId })
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
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-primary">
                {summary.completionPercentage}%
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Completed
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="h-8 gap-1 px-2.5 text-xs font-semibold"
              aria-label={isExpanded ? 'Collapse books' : 'Expand books'}
            >
              <span>{isExpanded ? 'Hide' : 'Show'}</span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-foreground">
            <span>{summary.completed} of {summary.total} Prabhupada Books Read</span>
          </div>
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

        {/* Collapsed view CTA */}
        {!isExpanded ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="w-full text-xs font-semibold"
            >
              Show Books ({books.length})
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </CardHeader>

      {isExpanded ? (
        <CardContent className="space-y-4 pt-5">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Book Cards */}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading Prabhupada books catalog...
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No books found matching &quot;{searchQuery}&quot; in this view.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredBooks.map((book) => {
                const isCompleted = book.status === 'completed'
                const isReading = book.status === 'reading'
                const isNotStarted = book.status === 'not_started'

                return (
                  <div
                    key={book.id}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 transition-colors ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-950 dark:bg-emerald-950/10'
                        : isReading
                          ? 'border-amber-200 bg-amber-50/30 dark:border-amber-950 dark:bg-amber-950/10'
                          : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Badge
                          variant="secondary"
                          className="mt-0.5 shrink-0 px-1.5 py-0.5 text-[11px] font-bold"
                        >
                          #{book.sequenceNumber}
                        </Badge>
                        <div>
                          <h4 className="text-sm font-semibold leading-tight text-foreground">
                            {book.title}
                          </h4>
                          {book.readingUrl ? (
                            <a
                              href={book.readingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <span>Read Online</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {/* Status indicator badge (shown only in read-only mode) */}
                      {!editable ? (
                        <div className="shrink-0">
                          {isCompleted ? (
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                              Completed
                            </Badge>
                          ) : isReading ? (
                            <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                              Reading
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              To Read
                            </Badge>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Interactive Status Controls (shown when editable) */}
                    {editable ? (
                      <div className="mt-3 flex items-center gap-1.5 border-t pt-2.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={isNotStarted ? 'secondary' : 'ghost'}
                          onClick={() => handleStatusChange(book.id, 'not_started')}
                          className={`h-7 flex-1 text-xs font-medium ${
                            isNotStarted ? 'border border-muted font-bold' : ''
                          }`}
                        >
                          To Read
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={isReading ? 'default' : 'ghost'}
                          onClick={() => handleStatusChange(book.id, 'reading')}
                          className={`h-7 flex-1 text-xs font-medium ${
                            isReading
                              ? 'bg-amber-500 text-white hover:bg-amber-600 font-bold'
                              : 'text-amber-600 hover:text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          Reading
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={isCompleted ? 'default' : 'ghost'}
                          onClick={() => handleStatusChange(book.id, 'completed')}
                          className={`h-7 flex-1 text-xs font-medium ${
                            isCompleted
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold'
                              : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          Done
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom collapse button */}
          <div className="pt-2 text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-xs text-muted-foreground"
            >
              Hide Books
              <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}
