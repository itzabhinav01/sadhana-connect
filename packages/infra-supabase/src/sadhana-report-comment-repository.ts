import type { SadhanaReportComment } from '@sadhana-connect/domain/entities/sadhana-report-comment'
import type {
  CreateCommentParams,
  SadhanaReportCommentRepository,
} from '@sadhana-connect/domain/repositories/sadhana-report-comment-repository'
import { getSupabaseClient } from '@sadhana-connect/infra-supabase/client'

interface CommentRow {
  id: string
  sadhana_report_id: string
  mentor_id: string
  mentor_name: string
  comment_text: string
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  'id, sadhana_report_id, mentor_id, mentor_name, comment_text, created_at, updated_at'

function mapRow(row: CommentRow): SadhanaReportComment {
  return {
    id: row.id,
    sadhanaReportId: row.sadhana_report_id,
    mentorId: row.mentor_id,
    mentorName: row.mentor_name,
    commentText: row.comment_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const supabaseSadhanaReportCommentRepository: SadhanaReportCommentRepository = {
  async listComments(sadhanaReportId) {
    const { data, error } = await getSupabaseClient()
      .from('sadhana_report_comments')
      .select(SELECT_COLUMNS)
      .eq('sadhana_report_id', sadhanaReportId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data as CommentRow[]).map(mapRow)
  },

  async createComment(params: CreateCommentParams) {
    const { data, error } = await getSupabaseClient()
      .from('sadhana_report_comments')
      .insert({
        sadhana_report_id: params.sadhanaReportId,
        mentor_id: params.mentorId,
        mentor_name: params.mentorName,
        comment_text: params.commentText,
      })
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as CommentRow)
  },

  async updateComment(commentId, commentText) {
    const { data, error } = await getSupabaseClient()
      .from('sadhana_report_comments')
      .update({ comment_text: commentText })
      .eq('id', commentId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error

    return mapRow(data as CommentRow)
  },

  async deleteComment(commentId) {
    const { error } = await getSupabaseClient()
      .from('sadhana_report_comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
  },
}
