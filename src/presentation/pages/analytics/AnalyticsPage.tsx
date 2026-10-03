import { Copy, ExternalLink, Sparkles } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  supabaseAuthRepository,
  supabaseProfileRepository,
  supabaseSadhanaReportRepository,
} from '@sadhana-connect/infra-supabase'
import {
  AI_PROVIDERS,
  AI_PROVIDER_LABELS,
  buildAiProviderUrl,
  buildSadhanaAiPrompt,
  getLastNDaysRange,
  useSadhanaAnalytics,
  validateDateRange,
  type AiProvider,
  type SadhanaDateRange,
} from '@sadhana-connect/sadhana'
import { ChartSkeleton } from '@/presentation/components/ChartSkeleton'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import {
  AnalyticsRangeSelector,
  type AnalyticsRangeOption,
} from '@/presentation/pages/analytics/AnalyticsRangeSelector'
import { AnalyticsSummaryCards } from '@/presentation/pages/analytics/AnalyticsSummaryCards'

// Code-split (Phase 20) — see the matching note in DevoteeDashboardPage.tsx.
// This whole page is chart-centric, so both charts defer together, but
// each keeps its own Suspense boundary rather than sharing one, so a
// slow fetch of one chart's chunk never blocks the other from appearing.
const AnalyticsRoundsChart = lazy(() =>
  import('@/presentation/pages/analytics/AnalyticsRoundsChart').then((m) => ({
    default: m.AnalyticsRoundsChart,
  })),
)
const AnalyticsStudyChart = lazy(() =>
  import('@/presentation/pages/analytics/AnalyticsStudyChart').then((m) => ({
    default: m.AnalyticsStudyChart,
  })),
)

// One page-level query (not per-card/per-chart, unlike the dashboard) —
// every section here is a facet of the exact same range query, so there
// is no independent-loading benefit to re-fetching per section.
export function AnalyticsPage() {
  const [option, setOption] = useState<AnalyticsRangeOption>('7')
  const [customRange, setCustomRange] = useState<SadhanaDateRange>(() =>
    getLastNDaysRange(7),
  )
  const [aiBusy, setAiBusy] = useState(false)
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null)

  // Quick options are always computed fresh from "today" on every render
  // rather than stored as fixed dates, so the range never goes stale
  // across a day boundary while the page is open.
  const range = option === 'custom' ? customRange : getLastNDaysRange(Number(option))
  const validation = validateDateRange(range.fromDate, range.toDate)

  const analyticsQuery = useSadhanaAnalytics(range.fromDate, range.toDate, {
    enabled: validation.valid,
  })

  async function buildCurrentUserAiPrompt(): Promise<string | null> {
    if (!validation.valid) return null
    setAiBusy(true)
    setAiStatusMessage(null)
    try {
      const session = await supabaseAuthRepository.getSession()
      if (!session?.userId) {
        setAiStatusMessage('Please sign in to generate AI analysis.')
        return null
      }
      const [profile, reports] = await Promise.all([
        supabaseProfileRepository.getProfile(session.userId),
        supabaseSadhanaReportRepository.listFullReportsInRange(
          session.userId,
          range.fromDate,
          range.toDate,
        ),
      ])
      return buildSadhanaAiPrompt({
        fromDate: range.fromDate,
        toDate: range.toDate,
        devotees: [
          {
            devoteeName: profile?.fullName || 'Devotee',
            reports,
          },
        ],
      })
    } catch {
      setAiStatusMessage('Could not load Sadhana reports for AI analysis.')
      return null
    } finally {
      setAiBusy(false)
    }
  }

  async function handleOpenAiProvider(provider: AiProvider) {
    const popup = window.open('about:blank', '_blank')
    const prompt = await buildCurrentUserAiPrompt()
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

  async function handleCopyAiPrompt() {
    const prompt = await buildCurrentUserAiPrompt()
    if (!prompt) return
    try {
      await navigator.clipboard?.writeText(prompt)
      setAiStatusMessage('AI analysis prompt copied to clipboard!')
    } catch {
      setAiStatusMessage('Could not copy prompt to clipboard.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Trends and totals from your sadhana reports.
        </p>
      </div>

      <AnalyticsRangeSelector
        option={option}
        customRange={customRange}
        error={validation.valid ? null : validation.error}
        onOptionChange={setOption}
        onCustomRangeChange={setCustomRange}
      />

      {validation.valid && analyticsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {validation.valid && analyticsQuery.isError ? (
        <p className="text-sm text-destructive">
          Something went wrong loading your analytics. Please try again.
        </p>
      ) : null}

      {validation.valid && analyticsQuery.data ? (
        analyticsQuery.data.totalReports === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              No Sadhana reports found for this range.
            </p>
            <Button asChild>
              <Link to="/sadhana">Fill Sadhana</Link>
            </Button>
          </div>
        ) : (
          <>
            <Card className="border-primary/25 bg-primary/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  <CardTitle className="text-base">AI Sadhana Analysis</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send your selected Sadhana range ({range.fromDate} to {range.toDate}) to your preferred AI assistant with structured Sadhana coaching rules.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {AI_PROVIDERS.map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      size="sm"
                      disabled={aiBusy}
                      onClick={() => void handleOpenAiProvider(provider)}
                    >
                      <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                      Analyze in {AI_PROVIDER_LABELS[provider]}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={aiBusy}
                    onClick={() => void handleCopyAiPrompt()}
                  >
                    <Copy className="mr-1.5 size-3.5" aria-hidden="true" />
                    Copy Prompt
                  </Button>
                </div>
                {aiStatusMessage ? (
                  <p className="text-xs font-medium text-primary">{aiStatusMessage}</p>
                ) : null}
              </CardContent>
            </Card>

            <AnalyticsSummaryCards summary={analyticsQuery.data} />
            <Suspense fallback={<ChartSkeleton title="Daily Total Rounds" />}>
              <AnalyticsRoundsChart chartData={analyticsQuery.data.roundsChartData} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton title="Reading & Hearing" />}>
              <AnalyticsStudyChart chartData={analyticsQuery.data.studyChartData} />
            </Suspense>
          </>
        )
      ) : null}
    </div>
  )
}
