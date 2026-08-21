import type { ManifestOptions } from 'vite-plugin-pwa'

// Single source of truth for the PWA manifest, imported by vite.config.ts
// (VitePWA's `manifest` option) and unit-tested directly here — the
// manifest itself is otherwise only observable in the built output.
export const pwaManifest: Partial<ManifestOptions> = {
  name: 'Sadhana Connect',
  short_name: 'Sadhana Connect',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  // Existing brand purple from public/favicon.svg — not a new color.
  theme_color: '#7e14ff',
  background_color: '#ffffff',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}
