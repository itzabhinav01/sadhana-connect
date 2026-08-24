import type { SadhanaReportComment } from '@sadhana-connect/domain/entities/sadhana-report-comment'

export interface CreateCommentParams {
  sadhanaReportId: string
  mentorId: string
  mentorName: string
  commentText: string
}

export interface SadhanaReportCommentRepository {
  // Ordered oldest-first (a chronological thread). RLS
  // (sadhana_report_comments_select) is the real authorization boundary —
  // sadhanaReportId is passed as-is, matching every other repository in
  // this codebase.
  listComments(sadhanaReportId: string): Promise<SadhanaReportComment[]>

  createComment(params: CreateCommentParams): Promise<SadhanaReportComment>

  // Author-only in practice, enforced by RLS — this method has no
  // separate authorId parameter because ownership is not this layer's
  // decision to make.
  updateComment(
    commentId: string,
    commentText: string,
  ): Promise<SadhanaReportComment>

  deleteComment(commentId: string): Promise<void>
}
