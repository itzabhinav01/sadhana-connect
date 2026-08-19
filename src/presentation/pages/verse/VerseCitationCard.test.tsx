import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { VerseCitationCard } from '@/presentation/pages/verse/VerseCitationCard'
import type { VerseOfTheDay } from '@/domain/entities/verse-of-the-day'

const verse: VerseOfTheDay = {
  id: 'v1',
  chapter: 2,
  verseNumber: '47',
  sourceUrl: 'https://vedabase.io/en/library/bg/2/47/',
  orderIndex: 0,
  scheduledDate: null,
  content: {
    sanskritTransliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
    translation: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.',
  },
}

const verseWithoutContent: VerseOfTheDay = { ...verse, content: null }

describe('VerseCitationCard', () => {
  it('renders the formatted citation and the author', () => {
    render(<VerseCitationCard verse={verse} />)

    expect(
      screen.getByRole('heading', { name: 'Bhagavad-gītā As It Is 2.47' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/His Divine Grace A\. C\. Bhaktivedanta Swami Prabhupāda/),
    ).toBeInTheDocument()
  })

  it('links "Read on VedaBase" to the source URL and opens it in a new tab', () => {
    render(<VerseCitationCard verse={verse} />)

    const link = screen.getByRole('link', { name: 'Read on VedaBase' })
    expect(link).toHaveAttribute('href', verse.sourceUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the Sanskrit transliteration and translation when content is available', () => {
    render(<VerseCitationCard verse={verse} />)

    expect(
      screen.getByText(verse.content!.sanskritTransliteration),
    ).toBeInTheDocument()
    expect(screen.getByText(verse.content!.translation)).toBeInTheDocument()
  })

  it('never renders purport text', () => {
    render(<VerseCitationCard verse={verse} />)

    expect(screen.queryByText(/purport/i)).not.toBeInTheDocument()
  })

  it('falls back to a citation-only display when content is missing, without erroring', () => {
    render(<VerseCitationCard verse={verseWithoutContent} />)

    expect(
      screen.getByRole('heading', { name: 'Bhagavad-gītā As It Is 2.47' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Read on VedaBase' }),
    ).toBeInTheDocument()
  })

  it('copies the citation and source URL to the clipboard, and confirms it', async () => {
    // @testing-library/user-event installs a real (in-memory) clipboard
    // stub on setup(), backing navigator.clipboard.writeText/readText —
    // exercised here instead of mocking navigator.clipboard directly.
    const user = userEvent.setup()
    render(<VerseCitationCard verse={verse} />)

    await user.click(screen.getByRole('button', { name: 'Copy Citation' }))

    await expect(navigator.clipboard.readText()).resolves.toBe(
      'Bhagavad-gītā As It Is 2.47\nHis Divine Grace A. C. Bhaktivedanta Swami Prabhupāda\nhttps://vedabase.io/en/library/bg/2/47/',
    )
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
  })
})
