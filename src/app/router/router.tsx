import { createBrowserRouter } from 'react-router-dom'

import { HomePage } from '@/presentation/pages/HomePage'
import { NotFoundPage } from '@/presentation/pages/NotFoundPage'
import { AuthConfirmPage } from '@/presentation/pages/auth/AuthConfirmPage'
import { CheckEmailPage } from '@/presentation/pages/auth/CheckEmailPage'
import { ForgotPasswordPage } from '@/presentation/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/presentation/pages/auth/LoginPage'
import { RegisterPage } from '@/presentation/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/presentation/pages/auth/ResetPasswordPage'
import { ProtectedRoute } from '@/presentation/routing/ProtectedRoute'
import { PublicOnlyRoute } from '@/presentation/routing/PublicOnlyRoute'

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <HomePage /> }],
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  { path: '/auth/confirm', element: <AuthConfirmPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/check-email', element: <CheckEmailPage /> },
  { path: '*', element: <NotFoundPage /> },
])
