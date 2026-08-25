import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults } from 'vitest/config'

import { pwaManifest } from './src/shared/config/pwa-manifest.ts'
import {
  appShellOfflineFallbackPlugin,
  isNavigationRequest,
  isSupabaseRequest,
} from './src/shared/config/pwa-runtime-caching.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Only registered/active in production builds — local `npm run dev`
      // must never have a service worker intercepting requests.
      devOptions: { enabled: false },
      registerType: 'prompt',
      injectRegister: null,
      manifest: pwaManifest,
      workbox: {
        // Precache the hashed build output (JS/CSS/icons/index.html) —
        // Workbox derives this list from Vite's own build manifest, so it
        // stays correct as the app's chunks change across deploys.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // vite-plugin-pwa defaults navigateFallback to 'index.html', which
        // auto-registers a cache-first NavigationRoute ahead of the
        // runtimeCaching rules below (first-match-wins), silently
        // overriding the network-first app-shell rule this app requires.
        // Explicitly disabled so the NetworkFirst rule below is the only
        // thing handling navigations.
        navigateFallback: undefined,
        runtimeCaching: [
          // App shell (HTML navigations): network-first, so an online
          // device always gets the freshest deploy, falling back to the
          // precached shell only when the network request fails (offline).
          {
            urlPattern: isNavigationRequest,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              // A route requested for the first time while offline (no
              // per-path cache entry yet) falls back to the precached
              // shell rather than failing outright — see the plugin's
              // own doc comment.
              plugins: [appShellOfflineFallbackPlugin],
            },
          },
          // Supabase Auth, PostgREST, and Edge Functions must never be
          // cached by the service worker — authenticated, per-user,
          // RLS-scoped responses have no safe representation in a
          // cross-user Cache Storage entry. NetworkOnly means "never
          // intercept" (Workbox's default for anything unmatched is
          // already network-only, this entry documents the boundary
          // explicitly rather than relying on the default).
          {
            urlPattern: isSupabaseRequest,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@sadhana-connect/domain': path.resolve(import.meta.dirname, './packages/domain/src'),
      '@sadhana-connect/infra-supabase': path.resolve(import.meta.dirname, './packages/infra-supabase/src'),
      '@sadhana-connect/auth': path.resolve(import.meta.dirname, './packages/auth/src'),
      '@sadhana-connect/shared': path.resolve(import.meta.dirname, './packages/shared/src'),
      '@sadhana-connect/sadhana': path.resolve(import.meta.dirname, './packages/sadhana/src'),
      '@sadhana-connect/verse': path.resolve(import.meta.dirname, './packages/verse/src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    // apps/mobile is a separate Expo/React Native workspace with its own
    // jest-expo test runner (npm test --workspace=apps/mobile) — its RN
    // source (Flow types, native module shims) isn't valid for Vite/Rolldown
    // to parse, so vitest's default test-file discovery must exclude it.
    exclude: [...configDefaults.exclude, 'apps/mobile/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'packages/*/src/**/*.test.{ts,tsx}',
        'src/shared/test/**',
        // Vendored shadcn/ui primitives — not app business logic.
        'src/presentation/components/ui/**',
        // Type-only / composition-root files with no branching logic.
        'src/main.tsx',
        'src/app/**',
        'src/**/*.d.ts',
      ],
    },
  },
})
