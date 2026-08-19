// A citation only — factual reference metadata and a link to VedaBase for
// the full verse page and purport, which this application does not store.
export interface VerseCitation {
  id: string
  chapter: number
  verseNumber: string
  sourceUrl: string
  orderIndex: number
  scheduledDate: string | null
}

// Śrīla Prabhupāda's Sanskrit transliteration and translation for a single
// scheduled selection, taken verbatim from Bhagavad-gītā As It Is. Never
// includes the purport or any other commentary.
export interface VerseContent {
  sanskritTransliteration: string
  translation: string
}

// The citation plus its local content, when available. `content` is
// nullable — not every citation is guaranteed to have seeded content — so
// the presentation layer can fall back to a citation-only display rather
// than assuming content always exists.
export type VerseOfTheDay = VerseCitation & { content: VerseContent | null }
