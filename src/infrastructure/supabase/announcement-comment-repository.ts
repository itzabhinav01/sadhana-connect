import type { AnnouncementComment } from '@/domain/entities/announcement-comment'
import type {
  AnnouncementCommentRepository,
  CreateAnnouncementCommentParams,
} from '@/domain/repositories/announcement-comment-repository'
import { supabase } from '@/infrastructure/supabase/client'

interface AnnouncementCommentRow {
  id: string
  announcement_id: string
  author_id: string
  author_name: string
  comment_text: string
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  'id, announcement_id, author_id, author_name, comment_text, created_at, updated_at'

function mapRow(row: AnnouncementCommentRow): AnnouncementComment {
  return {
    id: row.id,
    announcementId: row.announcement_id,
    authorId: row.author_id,
    authorName: row.author_name,
    commentText: row.comment_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const supabaseAnnouncementCommentRepository: AnnouncementCommentRepository = {
  async listComments(announcementId) {
    const { data, error } = await supabase
      .from('announcement_comments')
      .select(SELECT_COLUMNS)
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data as AnnouncementCommentRow[]).map(mapRow)
  },

  async createComment(params: CreateAnnouncementCommentParams) {
    const { data, error } = await supabase
      .from('announcement_comments')
      .insert({
        announcement_id: params.announcementId,
        author_id: params.authorId,
        author_name: params.authorName,
        comment_text: params.commentText,
      })
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as AnnouncementCommentRow)
  },

  async updateComment(commentId, commentText) {
    const { data, error } = await supabase
      .from('announcement_comments')
      .update({ comment_text: commentText })
      .eq('id', commentId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as AnnouncementCommentRow)
  },

  async deleteComment(commentId) {
    const { error } = await supabase.from('announcement_comments').delete().eq('id', commentId)

    if (error) throw error
  },
}
