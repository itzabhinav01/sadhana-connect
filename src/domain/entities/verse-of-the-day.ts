// A citation only — never the copyrighted translation or purport text. Per
// the Phase 11 licensing decision, without confirmed redistribution
// permission from the Bhaktivedanta Book Trust, this application stores and
// displays only factual reference metadata and a link to VedaBase.
export interface VerseCitation {
  id: string
  chapter: number
  verseNumber: string
  sourceUrl: string
  orderIndex: number
  scheduledDate: string | null
}
