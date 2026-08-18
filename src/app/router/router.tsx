import { createBrowserRouter } from 'react-router-dom'

import { NotFoundPage } from '@/presentation/pages/NotFoundPage'
import { ProfilePage } from '@/presentation/pages/ProfilePage'
import { SettingsPage } from '@/presentation/pages/SettingsPage'
import { AnalyticsPage } from '@/presentation/pages/analytics/AnalyticsPage'
import { DevoteeDashboardPage } from '@/presentation/pages/dashboard/DevoteeDashboardPage'
import { HistoryPage } from '@/presentation/pages/history/HistoryPage'
import { JapaCounterPage } from '@/presentation/pages/japa/JapaCounterPage'
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
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
