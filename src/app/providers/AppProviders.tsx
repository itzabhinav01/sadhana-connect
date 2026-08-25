import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@sadhana-connect/auth'
import { ServiceWorkerUpdateProvider } from '@/application/pwa/service-worker-update-provider'
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
            {/* Registers the service worker once, app-wide — including
                /login and other pre-auth routes, not just the
                authenticated shell. */}
            <ServiceWorkerUpdateProvider>
              <RouterProvider router={router} />
            </ServiceWorkerUpdateProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
