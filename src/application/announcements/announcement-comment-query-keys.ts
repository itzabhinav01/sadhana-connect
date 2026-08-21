// Scoped by the VIEWER's own userId and the specific announcement — same
// convention as commentQueryKeys (sadhana report comments): a viewer
// switching accounts on a shared device never shares a cache entry.
export const announcementCommentQueryKeys = {
  all: ['announcement-comments'] as const,
  list: (viewerUserId: string | null, announcementId: string) =>
    ['announcement-comments', viewerUserId, announcementId] as const,
}
