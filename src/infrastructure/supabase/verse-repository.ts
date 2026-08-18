import type { VerseCitation } from '@/domain/entities/verse-of-the-day'
import type { VerseRepository } from '@/domain/repositories/verse-repository'
import { supabase } from '@/infrastructure/supabase/client'

interface VerseRow {
  id: string
  chapter: number
  verse_number: string
  source_url: string
  order_index: number
  scheduled_date: string | null
}

function mapVerse(row: VerseRow): VerseCitation {
  return {
    id: row.id,
    chapter: row.chapter,
    verseNumber: row.verse_number,
    sourceUrl: row.source_url,
    orderIndex: row.order_index,
    scheduledDate: row.scheduled_date,
  }
}

export const supabaseVerseRepository: VerseRepository = {
  async listPublishedVerses() {
    const { data, error } = await supabase
      .from('verse_citations')
      .select('id, chapter, verse_number, source_url, order_index, scheduled_date')
      .eq('is_published', true)
      .order('order_index', { ascending: true })

    if (error) throw error

    return (data ?? []).map(mapVerse)
  },
}
