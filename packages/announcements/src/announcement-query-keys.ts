// Scoped by the viewer's own userId — unlike Verse of the Day,
// announcement visibility genuinely differs per viewer (role, temple
// group, own-authored drafts), so per-user cache isolation is correct
// here, not an exception.
export const announcementQueryKeys = {
  all: ['announcements'] as const,
  list: (viewerUserId: string | null) => ['announcements', viewerUserId] as const,
}
