import type { AdminUserFilters } from '@sadhana-connect/domain'

// Every key is scoped by the VIEWING SUPER ADMIN's own userId, matching the
// mentorQueryKeys/profileQueryKeys convention exactly — switching admin
// accounts changes every key's prefix, so nothing leaks across accounts.
export const adminQueryKeys = {
  all: ['admin'] as const,
  users: (adminUserId: string | null, filters: AdminUserFilters) =>
    ['admin', 'users', adminUserId, filters] as const,
  userDetail: (adminUserId: string | null, targetUserId: string) =>
    ['admin', 'user-detail', adminUserId, targetUserId] as const,
  assignments: (
    adminUserId: string | null,
    filters: { mentorId?: string; devoteeId?: string },
  ) => ['admin', 'assignments', adminUserId, filters] as const,
  mentorDevoteeCounts: (adminUserId: string | null) =>
    ['admin', 'mentor-devotee-counts', adminUserId] as const,
  mentorDevoteeCount: (adminUserId: string | null, mentorId: string) =>
    ['admin', 'mentor-devotee-count', adminUserId, mentorId] as const,
  templeGroups: (adminUserId: string | null) =>
    ['admin', 'temple-groups', adminUserId] as const,
  dashboardSummary: (adminUserId: string | null) =>
    ['admin', 'dashboard-summary', adminUserId] as const,
}
