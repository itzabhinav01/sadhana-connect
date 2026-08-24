import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useVerseOfTheDay } from '@/application/verse/use-verse-of-the-day'
import { verseQueryKeys } from '@/application/verse/verse-query-keys'
import { getLocalDateIso } from '@/shared/utils/date'

const { listPublishedVersesMock } = vi.hoisted(() => ({
  listPublishedVersesMock: vi.fn(),
}))

vi.mock('@sadhana-connect/infra-supabase/verse-repository', () => ({
  supabaseVerseRepository: { listPublishedVerses: listPublishedVersesMock },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useVerseOfTheDay', () => {
  beforeEach(() => {
    listPublishedVersesMock.mockReset()
  })

  it('resolves the deterministic verse for today from the published dataset', async () => {
    listPublishedVersesMock.mockResolvedValue([
      {
        id: 'v0',
        chapter: 2,
        verseNumber: '47',
        sourceUrl: 'https://vedabase.io/en/library/bg/2/47/',
        orderIndex: 0,
        scheduledDate: null,
        content: {
          sanskritTransliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
          translation: 'You have a right to perform your prescribed duty.',
        },
      },
    ])

    const { result } = renderHook(() => useVerseOfTheDay(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // A single-verse published dataset always resolves to that verse,
    // for any date, so this is deterministic regardless of "today".
    expect(result.current.data?.id).toBe('v0')
    // The content arrives on the same object as the citation — one
    // repository call, one cache entry, never a second query for content.
    expect(listPublishedVersesMock).toHaveBeenCalledTimes(1)
    expect(result.current.data?.content?.translation).toBe(
      'You have a right to perform your prescribed duty.',
    )
  })

  it('resolves to null (not an error) when there are no published verses', async () => {
    listPublishedVersesMock.mockResolvedValue([])

    const { result } = renderHook(() => useVerseOfTheDay(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('caches under a query key scoped only by the local date, with no userId', async () => {
    listPublishedVersesMock.mockResolvedValue([
      {
        id: 'v0',
        chapter: 2,
        verseNumber: '47',
        sourceUrl: 'https://vedabase.io/en/library/bg/2/47/',
        orderIndex: 0,
        scheduledDate: null,
        content: {
          sanskritTransliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
          translation: 'You have a right to perform your prescribed duty.',
        },
      },
    ])
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useVerseOfTheDay(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const today = getLocalDateIso()
    expect(verseQueryKeys.detail(today)).toEqual(['verse-of-the-day', today])
    expect(queryClient.getQueryData(verseQueryKeys.detail(today))).toEqual(
      result.current.data,
    )
  })

  it('surfaces a repository failure as a query error, never a fabricated result', async () => {
    listPublishedVersesMock.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useVerseOfTheDay(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
