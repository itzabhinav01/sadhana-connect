import { createBrowserRouter } from 'react-router-dom'

import { NotFoundPage } from '@/presentation/pages/NotFoundPage'
import { ProfilePage } from '@/presentation/pages/ProfilePage'
import { SettingsPage } from '@/presentation/pages/SettingsPage'
import { AnalyticsPage } from '@/presentation/pages/analytics/AnalyticsPage'
import { DevoteeDashboardPage } from '@/presentation/pages/dashboard/DevoteeDashboardPage'
import { AnnouncementDetailPage } from '@/presentation/pages/announcements/AnnouncementDetailPage'
import { HistoryPage } from '@/presentation/pages/history/HistoryPage'
import { JapaCounterPage } from '@/presentation/pages/japa/JapaCounterPage'
import { NotificationsPage } from '@/presentation/pages/notifications/NotificationsPage'
import { SadhanaFormPage } from '@/presentation/pages/sadhana/SadhanaFormPage'
import { VerseOfTheDayPage } from '@/presentation/pages/verse/VerseOfTheDayPage'
import { AuthConfirmPage } from '@/presentation/pages/auth/AuthConfirmPage'
import { CheckEmailPage } from '@/presentation/pages/auth/CheckEmailPage'
import { ForgotPasswordPage } from '@/presentation/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/presentation/pages/auth/LoginPage'
import { RegisterPage } from '@/presentation/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/presentation/pages/auth/ResetPasswordPage'
import { AppLayout } from '@/presentation/layouts/AppLayout'
import { AuthLayout } from '@/presentation/layouts/AuthLayout'
import { RootLayout } from '@/presentation/layouts/RootLayout'
import { ProtectedRoute } from '@/presentation/routing/ProtectedRoute'
import { PublicOnlyRoute } from '@/presentation/routing/PublicOnlyRoute'
import { RequireRole } from '@/presentation/routing/RequireRole'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            element: <PublicOnlyRoute />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
              { path: '/forgot-password', element: <ForgotPasswordPage /> },
            ],
          },
          // Deliberately not under PublicOnlyRoute — the password-recovery
          // flow establishes a temporary session on /reset-password that
          // must not be redirected away. See PublicOnlyRoute's own note.
          { path: '/auth/confirm', element: <AuthConfirmPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
          { path: '/check-email', element: <CheckEmailPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DevoteeDashboardPage /> },
              { path: '/sadhana', element: <SadhanaFormPage /> },
              { path: '/history', element: <HistoryPage /> },
              { path: '/analytics', element: <AnalyticsPage /> },
              { path: '/japa', element: <JapaCounterPage /> },
              { path: '/verse-of-the-day', element: <VerseOfTheDayPage /> },
              { path: '/profile', element: <ProfilePage /> },
              { path: '/settings', element: <SettingsPage /> },
              { path: '/announcements/:id', element: <AnnouncementDetailPage /> },
              {
                // UX/navigation guard only, same caveat as the mentor/admin
                // RequireRole blocks below — notifications_select (0001)
                // already scopes every row to recipient_id = auth.uid(),
                // and no producer in this phase creates a notification for
                // any role but devotee, so this guard's only job is
                // keeping the notification center out of the mentor/admin
                // shell (approved product decision, Phase 17).
                element: <RequireRole allow={['devotee']} />,
                children: [
                  { path: '/notifications', element: <NotificationsPage /> },
                ],
              },
              {
                // UX/navigation guard only — redirects non-mentors home.
                // RLS (mentor_assignments_select, profiles_select,
                // sadhana_reports_select, all via private.is_mentor_of)
                // remains the real security boundary regardless of this
                // guard; see RequireRole's own documentation.
                //
                // Every child route below is lazy-loaded (Phase 20) from
                // the single shared @/presentation/pages/mentor/mentor-routes
                // module — router.tsx itself never statically imports any
                // mentor page, so a devotee session's initial bundle never
                // includes mentor-only code. Loading is purely a chunk-
                // fetch timing change; RequireRole's own authorization
                // check above is completely unmodified.
                element: <RequireRole allow={['mentor']} />,
                children: [
                  {
                    path: '/mentor',
                    lazy: async () => {
                      const { MentorDashboardPage } = await import(
                        '@/presentation/pages/mentor/mentor-routes'
                      )
                      return { Component: MentorDashboardPage }
                    },
                  },
                  {
                    path: '/mentor/devotee/:id',
                    lazy: async () => {
                      const { MentorDevoteeDetailPage } = await import(
                        '@/presentation/pages/mentor/mentor-routes'
                      )
                      return { Component: MentorDevoteeDetailPage }
                    },
                  },
                  {
                    path: '/mentor/announcements',
                    lazy: async () => {
                      const { MentorAnnouncementsPage } = await import(
                        '@/presentation/pages/mentor/mentor-routes'
                      )
                      return { Component: MentorAnnouncementsPage }
                    },
                  },
                ],
              },
              {
                // UX/navigation guard only, same caveat as the mentor
                // RequireRole above — every admin route's actual data
                // access is independently enforced by RLS
                // (is_super_admin() branches) and, for the Auth-Admin
                // operations, the trusted Edge Function's own
                // authorization check. This guard just keeps a
                // non-super-admin from seeing the admin shell at all.
                //
                // Every child route below is lazy-loaded (Phase 20) from
                // the single shared @/presentation/pages/admin/admin-routes
                // module — same reasoning as the mentor subtree above.
                element: <RequireRole allow={['super_admin']} />,
                children: [
                  {
                    path: '/admin',
                    lazy: async () => {
                      const { AdminDashboardPage } = await import(
                        '@/presentation/pages/admin/admin-routes'
                      )
                      return { Component: AdminDashboardPage }
                    },
                  },
                  {
                    path: '/admin/users',
                    lazy: async () => {
                      const { AdminUsersPage } = await import(
                        '@/presentation/pages/admin/admin-routes'
                      )
                      return { Component: AdminUsersPage }
                    },
                  },
                  {
                    path: '/admin/users/:id',
                    lazy: async () => {
                      const { AdminUserDetailPage } = await import(
                        '@/presentation/pages/admin/admin-routes'
                      )
                      return { Component: AdminUserDetailPage }
                    },
                  },
                  {
                    path: '/admin/mentors',
                    lazy: async () => {
                      const { AdminMentorsPage } = await import(
                        '@/presentation/pages/admin/admin-routes'
                      )
                      return { Component: AdminMentorsPage }
                    },
                  },
                  {
                    path: '/admin/assignments',
                    lazy: async () => {
                      const { AdminAssignmentsPage } = await import(
                        '@/presentation/pages/admin/admin-routes'
                      )
                      return { Component: AdminAssignmentsPage }
                    },
                  },
                  {
                    path: '/admin/temple-groups',
                    lazy: async () => {
                      const { AdminTempleGroupsPage } = await import(
                        '@/presentation/pages/admin/admin-routes'
                      )
                      return { Component: AdminTempleGroupsPage }
                    },
                  },
                  {
                    path: '/admin/announcements',
                    lazy: async () => {
                      const { AdminAnnouncementsPage } = await import(
                        '@/presentation/pages/admin/admin-routes'
                      )
                      return { Component: AdminAnnouncementsPage }
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
