import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/application/auth/session-provider'
import { ThemeProvider } from '@/application/theme/theme-provider'
import { queryClient } from '@/app/providers/query-client'
import { router } from '@/app/router/router'
import { TooltipProvider } from '@/presentation/components/ui/tooltip'

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
