// Scoped by the viewer's own userId — same leakage-prevention pattern as
// sadhanaQueryKeys/commentQueryKeys throughout this codebase: switching
// users (or logging out) must never serve another account's cached
// notifications.
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: (userId: string | null) => ['notifications', 'list', userId] as const,
  unreadCount: (userId: string | null) =>
    ['notifications', 'unread-count', userId] as const,
}
