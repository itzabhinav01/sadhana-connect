import { createBrowserRouter } from 'react-router-dom'

import { NotFoundPage } from '@/presentation/pages/NotFoundPage'
import { ProfilePage } from '@/presentation/pages/ProfilePage'
import { SettingsPage } from '@/presentation/pages/SettingsPage'
import { AdminAnnouncementsPage } from '@/presentation/pages/admin/AdminAnnouncementsPage'
import { AdminAssignmentsPage } from '@/presentation/pages/admin/AdminAssignmentsPage'
import { AdminDashboardPage } from '@/presentation/pages/admin/AdminDashboardPage'
import { AdminMentorsPage } from '@/presentation/pages/admin/AdminMentorsPage'
import { AdminTempleGroupsPage } from '@/presentation/pages/admin/AdminTempleGroupsPage'
import { AdminUserDetailPage } from '@/presentation/pages/admin/AdminUserDetailPage'
import { AdminUsersPage } from '@/presentation/pages/admin/AdminUsersPage'
import { AnalyticsPage } from '@/presentation/pages/analytics/AnalyticsPage'
import { DevoteeDashboardPage } from '@/presentation/pages/dashboard/DevoteeDashboardPage'
import { HistoryPage } from '@/presentation/pages/history/HistoryPage'
import { JapaCounterPage } from '@/presentation/pages/japa/JapaCounterPage'
import { MentorAnnouncementsPage } from '@/presentation/pages/mentor/MentorAnnouncementsPage'
import { MentorDashboardPage } from '@/presentation/pages/mentor/MentorDashboardPage'
import { MentorDevoteeDetailPage } from '@/presentation/pages/mentor/MentorDevoteeDetailPage'
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
              {
                // UX/navigation guard only — redirects non-mentors home.
                // RLS (mentor_assignments_select, profiles_select,
                // sadhana_reports_select, all via private.is_mentor_of)
                // remains the real security boundary regardless of this
                // guard; see RequireRole's own documentation.
                element: <RequireRole allow={['mentor']} />,
                children: [
                  { path: '/mentor', element: <MentorDashboardPage /> },
                  {
                    path: '/mentor/devotee/:id',
                    element: <MentorDevoteeDetailPage />,
                  },
                  {
                    path: '/mentor/announcements',
                    element: <MentorAnnouncementsPage />,
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
                element: <RequireRole allow={['super_admin']} />,
                children: [
                  { path: '/admin', element: <AdminDashboardPage /> },
                  { path: '/admin/users', element: <AdminUsersPage /> },
                  { path: '/admin/users/:id', element: <AdminUserDetailPage /> },
                  { path: '/admin/mentors', element: <AdminMentorsPage /> },
                  { path: '/admin/assignments', element: <AdminAssignmentsPage /> },
                  { path: '/admin/temple-groups', element: <AdminTempleGroupsPage /> },
                  { path: '/admin/announcements', element: <AdminAnnouncementsPage /> },
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
