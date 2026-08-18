import type {
  Announcement,
  AnnouncementScope,
} from '@/domain/entities/announcement'
import type {
  AnnouncementRepository,
  CreateAnnouncementParams,
  UpdateAnnouncementParams,
} from '@/domain/repositories/announcement-repository'
import { supabase } from '@/infrastructure/supabase/client'

interface AnnouncementRow {
  id: string
  author_id: string | null
  title: string
  content: string
  scope: AnnouncementScope
  temple_group_id: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  'id, author_id, title, content, scope, temple_group_id, is_published, published_at, created_at, updated_at'

function mapRow(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    content: row.content,
    scope: row.scope,
    templeGroupId: row.temple_group_id,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const supabaseAnnouncementRepository: AnnouncementRepository = {
  async listVisibleAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select(SELECT_COLUMNS)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data as AnnouncementRow[]).map(mapRow)
  },

  async createAnnouncement(params: CreateAnnouncementParams) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        author_id: params.authorId,
        title: params.title,
        content: params.content,
        scope: params.scope,
        temple_group_id: params.templeGroupId,
        is_published: params.isPublished,
        published_at: params.isPublished ? new Date().toISOString() : null,
      })
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as AnnouncementRow)
  },

  async updateAnnouncement(id, params: UpdateAnnouncementParams) {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        title: params.title,
        content: params.content,
        is_published: params.isPublished,
        ...(params.isPublished ? { published_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as AnnouncementRow)
  },

  async deleteAnnouncement(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)

    if (error) throw error
  },
}
