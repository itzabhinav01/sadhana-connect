import type { AnnouncementComment } from '@/domain/entities/announcement-comment'

export interface CreateAnnouncementCommentParams {
  announcementId: string
  authorId: string
  authorName: string
  commentText: string
}

export interface AnnouncementCommentRepository {
  // Ordered oldest-first (a chronological thread), matching
  // SadhanaReportCommentRepository.listComments exactly. RLS
  // (announcement_comments_select) is the real authorization boundary —
  // announcementId is passed as-is.
  listComments(announcementId: string): Promise<AnnouncementComment[]>

  createComment(params: CreateAnnouncementCommentParams): Promise<AnnouncementComment>

  // Author-only in practice, enforced by RLS (announcement_comments_update)
  // — no separate authorId parameter, ownership is not this layer's
  // decision to make.
  updateComment(commentId: string, commentText: string): Promise<AnnouncementComment>

  deleteComment(commentId: string): Promise<void>
}
