import { Copy, ExternalLink, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { supabaseSadhanaReportRepository } from '@sadhana-connect/infra-supabase'
import { filterMentorDevotees, type MentorDevoteeFilter, useMentorDevotees } from '@sadhana-connect/mentor'
import {
  AI_PROVIDERS,
  AI_PROVIDER_LABELS,
  buildAiProviderUrl,
  buildSadhanaAiPrompt,
  getLastNDaysRange,
  validateDateRange,
  type AiProvider,
  type SadhanaDateRange,
} from '@sadhana-connect/sadhana'
import { DateRangeInputs } from '@/presentation/components/shared/DateRangeInputs'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { MentorDevoteeFilterTabs } from '@/presentation/pages/mentor/MentorDevoteeFilterTabs'
import { MentorDevoteeList } from '@/presentation/pages/mentor/MentorDevoteeList'
import { MentorSummaryCards } from '@/presentation/pages/mentor/MentorSummaryCards'

type AiRangeOption = '7' | '14' | '30' | 'custom'

export function MentorDashboardPage() {
  const [filter, setFilter] = useState<MentorDevoteeFilter>('all')
  const [search, setSearch] = useState('')
  const [aiExpanded, setAiExpanded] = useState(false)
  const [aiRangeOption, setAiRangeOption] = useState<AiRangeOption>('7')
  const [aiCustomRange, setAiCustomRange] = useState<SadhanaDateRange>(() => getLastNDaysRange(7))
  const [selectedDevoteeIds, setSelectedDevoteeIds] = useState<string[] | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null)
  const devoteesQuery = useMentorDevotees()

  const summaries = useMemo(() => devoteesQuery.data ?? [], [devoteesQuery.data])
  const statusFiltered = filterMentorDevotees(summaries, filter)
  const searchTerm = search.trim().toLowerCase()
  const filteredSummaries = searchTerm
    ? statusFiltered.filter((summary) => summary.fullName.toLowerCase().includes(searchTerm))
    : statusFiltered

  const effectiveSelectedIds = useMemo(
    () => selectedDevoteeIds ?? summaries.map((s) => s.devoteeId),
    [selectedDevoteeIds, summaries],
  )

  const aiRange =
    aiRangeOption === 'custom' ? aiCustomRange : getLastNDaysRange(Number(aiRangeOption))
  const aiRangeValidation = validateDateRange(aiRange.fromDate, aiRange.toDate)

  function toggleDevoteeSelection(devoteeId: string) {
    setAiStatusMessage(null)
    setSelectedDevoteeIds((prev) => {
      const current = prev ?? summaries.map((s) => s.devoteeId)
      return current.includes(devoteeId)
        ? current.filter((id) => id !== devoteeId)
        : [...current, devoteeId]
    })
  }

  async function buildMentorPrompt(): Promise<string | null> {
    if (!aiRangeValidation.valid) {
      setAiStatusMessage(aiRangeValidation.error)
      return null
    }
    const chosenSummaries = summaries.filter((s) => effectiveSelectedIds.includes(s.devoteeId))
    if (chosenSummaries.length === 0) {
      setAiStatusMessage('Select at least one devotee to analyze.')
      return null
    }
    setAiBusy(true)
    setAiStatusMessage(null)
    try {
      const devotees = await Promise.all(
        chosenSummaries.map(async (s) => ({
          devoteeName: s.fullName,
          reports: await supabaseSadhanaReportRepository.listFullReportsInRange(
            s.devoteeId,
            aiRange.fromDate,
            aiRange.toDate,
          ),
        })),
      )
      return buildSadhanaAiPrompt({
        fromDate: aiRange.fromDate,
        toDate: aiRange.toDate,
        devotees,
      })
    } catch {
      setAiStatusMessage('Could not load Sadhana reports for AI analysis.')
      return null
    } finally {
      setAiBusy(false)
    }
  }

  async function handleLaunchMentorAi(provider: AiProvider) {
    const popup = window.open('about:blank', '_blank')
    const prompt = await buildMentorPrompt()
    if (!prompt) {
      popup?.close()
      return
    }
    try {
      await navigator.clipboard?.writeText(prompt)
    } catch {
      // Ignore clipboard error
    }
    const targetUrl = buildAiProviderUrl(provider, prompt)
    if (popup) {
      popup.location.href = targetUrl
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
    setAiStatusMessage(
      `Opened ${AI_PROVIDER_LABELS[provider]} (prompt also copied to clipboard).`,
    )
  }

  async function handleCopyMentorPrompt() {
    const prompt = await buildMentorPrompt()
    if (!prompt) return
    try {
      await navigator.clipboard?.writeText(prompt)
      setAiStatusMessage('AI analysis prompt copied to clipboard!')
    } catch {
      setAiStatusMessage('Could not copy prompt to clipboard.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Mentor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor your assigned devotees&apos; daily sadhana.
        </p>
      </div>

      {devoteesQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {devoteesQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your devotees. Please try again.
        </p>
      ) : null}

      {devoteesQuery.isSuccess && summaries.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-6">
          <p className="text-sm text-muted-foreground">
            No devotees are currently assigned to you.
          </p>
        </div>
      ) : null}

      {devoteesQuery.isSuccess && summaries.length > 0 ? (
        <>
          <MentorSummaryCards summaries={summaries} />

          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  <CardTitle className="text-base">
                    AI Sadhana Analysis (Mentor Mode)
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant={aiExpanded ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setAiExpanded((prev) => !prev)}
                >
                  {aiExpanded
                    ? 'Hide AI Analysis'
                    : `Analyze Devotees with AI (${effectiveSelectedIds.length}/${summaries.length})`}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select a date range and one or multiple devotees to analyze their Sadhana performance in ChatGPT, Gemini, or Claude.
              </p>
            </CardHeader>

            {aiExpanded ? (
              <CardContent className="flex flex-col gap-4 border-t border-border/60 pt-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1. Select Date Range
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: '7', label: 'Last 7 days' },
                        { value: '14', label: 'Last 14 days' },
                        { value: '30', label: 'Last 30 days' },
                        { value: 'custom', label: 'Custom range' },
                      ] as const
                    ).map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={aiRangeOption === opt.value ? 'default' : 'outline'}
                        onClick={() => setAiRangeOption(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  {aiRangeOption === 'custom' ? (
                    <div className="pt-1">
                      <DateRangeInputs
                        idPrefix="mentor-ai"
                        fromDate={aiCustomRange.fromDate}
                        toDate={aiCustomRange.toDate}
                        onFromDateChange={(fromDate) =>
                          setAiCustomRange({ ...aiCustomRange, fromDate })
                        }
                        onToDateChange={(toDate) =>
                          setAiCustomRange({ ...aiCustomRange, toDate })
                        }
                      />
                    </div>
                  ) : null}
                  {!aiRangeValidation.valid ? (
                    <p className="text-xs text-destructive">{aiRangeValidation.error}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      2. Select Devotees ({effectiveSelectedIds.length} of {summaries.length}{' '}
                      selected)
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          setSelectedDevoteeIds(summaries.map((s) => s.devoteeId))
                        }
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSelectedDevoteeIds([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summaries.map((summary) => {
                      const isSelected = effectiveSelectedIds.includes(summary.devoteeId)
                      return (
                        <button
                          key={summary.devoteeId}
                          type="button"
                          onClick={() => toggleDevoteeSelection(summary.devoteeId)}
                          aria-pressed={isSelected}
                          className={
                            isSelected
                              ? 'rounded-full border border-primary bg-primary/15 px-3 py-1 text-xs font-semibold text-primary transition-colors'
                              : 'rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors'
                          }
                        >
                          {isSelected ? '✓ ' : ''}
                          {summary.fullName}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    3. Open in AI Assistant
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {AI_PROVIDERS.map((provider) => (
                      <Button
                        key={provider}
                        type="button"
                        size="sm"
                        disabled={
                          aiBusy ||
                          !aiRangeValidation.valid ||
                          effectiveSelectedIds.length === 0
                        }
                        onClick={() => void handleLaunchMentorAi(provider)}
                      >
                        <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                        {AI_PROVIDER_LABELS[provider]}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        aiBusy ||
                        !aiRangeValidation.valid ||
                        effectiveSelectedIds.length === 0
                      }
                      onClick={() => void handleCopyMentorPrompt()}
                    >
                      <Copy className="mr-1.5 size-3.5" aria-hidden="true" />
                      Copy Prompt
                    </Button>
                  </div>
                  {aiStatusMessage ? (
                    <p className="text-xs font-medium text-primary">{aiStatusMessage}</p>
                  ) : null}
                </div>
              </CardContent>
            ) : null}
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <MentorDevoteeFilterTabs filter={filter} onFilterChange={setFilter} />
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search devotees by name…"
                aria-label="Search devotees by name"
                className="pl-9"
              />
            </div>
          </div>
          {filteredSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No devotees match this search.' : 'No devotees match this filter.'}
            </p>
          ) : (
            <MentorDevoteeList summaries={filteredSummaries} />
          )}
        </>
      ) : null}
    </div>
  )
}
