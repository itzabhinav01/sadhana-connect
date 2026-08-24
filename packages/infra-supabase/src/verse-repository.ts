import type { VerseOfTheDay } from '@sadhana-connect/domain'
import type { VerseRepository } from '@sadhana-connect/domain'
import { getSupabaseClient } from './client'

interface VerseRow {
  id: string
  chapter: number
  verse_number: string
  source_url: string
  order_index: number
  scheduled_date: string | null
  // verse_contents.verse_citation_id is itself that table's primary key, so
  // this is a one-to-one relationship — PostgREST embeds it as a single
  // object, or null when no content row exists (or is visible under RLS)
  // for this citation, never an array.
  verse_contents: { sanskrit_transliteration: string; translation: string } | null
}

function mapVerse(row: VerseRow): VerseOfTheDay {
  return {
    id: row.id,
    chapter: row.chapter,
    verseNumber: row.verse_number,
    sourceUrl: row.source_url,
    orderIndex: row.order_index,
    scheduledDate: row.scheduled_date,
    content: row.verse_contents
      ? {
          sanskritTransliteration: row.verse_contents.sanskrit_transliteration,
          translation: row.verse_contents.translation,
        }
      : null,
  }
}

export const supabaseVerseRepository: VerseRepository = {
  async listPublishedVerses() {
    const { data, error } = await getSupabaseClient()
      .from('verse_citations')
      .select(
        'id, chapter, verse_number, source_url, order_index, scheduled_date, verse_contents(sanskrit_transliteration, translation)',
      )
      .eq('is_published', true)
      .order('order_index', { ascending: true })

    if (error) throw error

    const rows = data as unknown as VerseRow[]

    return rows.map(mapVerse)
  },
}
