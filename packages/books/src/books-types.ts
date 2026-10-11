export type BookReadingStatus = 'not_started' | 'reading' | 'completed'

export interface PrabhupadaBook {
  id: number
  sequenceNumber: number
  title: string
  readingUrl: string | null
}

export interface DevoteeBookProgress {
  id?: string
  profileId: string
  bookId: number
  status: BookReadingStatus
  completedAt?: string | null
  updatedAt?: string
}

export interface BookWithProgress extends PrabhupadaBook {
  status: BookReadingStatus
  completedAt?: string | null
}

export interface BookProgressSummary {
  total: number
  completed: number
  reading: number
  notStarted: number
  completionPercentage: number
}
