import { QueryClientContext } from '@tanstack/react-query'
import {
  supabaseAuthRepository,
  supabaseSadhanaReportRepository,
} from '@sadhana-connect/infra-supabase'
import { addDaysIso, buildDateRangeList, getLocalDateIso } from '@sadhana-connect/shared'
import { useContext, useEffect, useMemo, useState } from 'react'

import { cn } from '@/shared/utils/cn'

const MONTH_ABBR = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

function parseDayAndMonth(isoDate: string): { day: string; month: string } {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return { day: isoDate, month: '' }
  const monthIdx = Number(parts[1]) - 1
  const dayNum = Number(parts[2])
  return {
    day: String(Number.isNaN(dayNum) ? parts[2] : dayNum),
    month: MONTH_ABBR[monthIdx] ?? parts[1],
  }
}

interface SadhanaDateStripProps {
  selectedDate: string
  hasExistingReport: boolean
  onSelectDate: (isoDate: string) => void
}

export function SadhanaDateStrip({
  selectedDate,
  hasExistingReport,
  onSelectDate,
}: SadhanaDateStripProps) {
  const queryClient = useContext(QueryClientContext)
  const [fetchedLoggedDates, setFetchedLoggedDates] = useState<string[]>([])

  const today = getLocalDateIso()
  const fromDate = addDaysIso(today, -6)

  const stripDates = useMemo(() => {
    const recent7 = buildDateRangeList(fromDate, today)
    if (selectedDate && !recent7.includes(selectedDate)) {
      return [selectedDate, ...recent7]
    }
    return recent7
  }, [fromDate, today, selectedDate])

  useEffect(() => {
    if (!queryClient) return
    let cancelled = false
    supabaseAuthRepository
      .getSession()
      .then((session) =>
        session?.userId
          ? supabaseSadhanaReportRepository.listRecentReports(session.userId, 14)
          : [],
      )
      .then((reports) => {
        if (!cancelled && Array.isArray(reports)) {
          setFetchedLoggedDates(reports.map((r) => r.reportDate))
        }
      })
      .catch(() => {
        // Ignore background fetch errors in strip indicator
      })
    return () => {
      cancelled = true
    }
  }, [queryClient, selectedDate, hasExistingReport])

  const loggedDateSet = useMemo(() => {
    const set = new Set(fetchedLoggedDates)
    if (hasExistingReport) {
      set.add(selectedDate)
    }
    return set
  }, [fetchedLoggedDates, hasExistingReport, selectedDate])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 overflow-x-auto py-1">
        {stripDates.map((isoDate) => {
          const isSelected = isoDate === selectedDate
          const isLogged = loggedDateSet.has(isoDate)
          const { day, month } = parseDayAndMonth(isoDate)

          return (
            <button
              key={isoDate}
              type="button"
              onClick={() => onSelectDate(isoDate)}
              aria-label={`Select date ${isoDate}`}
              aria-pressed={isSelected}
              className={cn(
                'relative flex h-[78px] w-[62px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[18px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border border-blue-400 bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : isLogged
                    ? 'border-[1.5px] border-amber-600 bg-amber-50/90 text-amber-700 dark:border-amber-500/80 dark:bg-[#1e1b2e] dark:text-amber-400'
                    : 'border-[1.5px] border-dashed border-rose-500/80 bg-rose-50/60 text-rose-600 dark:border-rose-500/75 dark:bg-[#1b2234] dark:text-rose-300',
              )}
            >
              {isLogged && !isSelected ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-amber-500/15 dark:bg-amber-600/25"
                />
              ) : null}
              <span className="relative z-10 text-[22px] leading-6 font-bold">{day}</span>
              <span className="relative z-10 mt-0.5 text-[11px] font-bold tracking-wider">
                {month}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-600" aria-hidden="true" />
          Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
          Filled
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2 rounded-full border border-dashed border-rose-500"
            aria-hidden="true"
          />
          Pending
        </span>
      </div>
    </div>
  )
}
