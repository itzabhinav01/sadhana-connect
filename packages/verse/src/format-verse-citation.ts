export const SCRIPTURE_NAME = 'Bhagavad-gītā As It Is'
export const AUTHOR_NAME = 'His Divine Grace A. C. Bhaktivedanta Swami Prabhupāda'

interface CitationLike {
  chapter: number
  verseNumber: string
}

export function formatVerseCitation(verse: CitationLike): string {
  return `${SCRIPTURE_NAME} ${verse.chapter}.${verse.verseNumber}`
}

// Everything the Copy Citation action places on the clipboard — the
// factual reference and the VedaBase link only, never any translation or
// purport text (none of which this application stores or displays).
export function formatVerseCitationForCopy(
  verse: CitationLike & { sourceUrl: string },
): string {
  return `${formatVerseCitation(verse)}\n${AUTHOR_NAME}\n${verse.sourceUrl}`
}
