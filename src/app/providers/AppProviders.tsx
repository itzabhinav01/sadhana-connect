import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/application/auth/session-provider'
import { queryClient } from '@/app/providers/query-client'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { router } from '@/app/router/router'

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
