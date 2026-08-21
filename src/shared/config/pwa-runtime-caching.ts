// Extracted so the routing predicates that decide NetworkFirst (app shell)
// vs. NetworkOnly (never cache Supabase) can be unit-tested directly —
// vite.config.ts's `workbox.runtimeCaching` isn't otherwise reachable
// from a test.

export function isNavigationRequest({ request }: { request: Request }): boolean {
  return request.mode === 'navigate'
}

export function isSupabaseRequest({ url }: { url: URL }): boolean {
  return url.hostname.endsWith('.supabase.co')
}

// This is an SPA: every route resolves to the same precached index.html,
// then React Router takes over client-side. The app-shell NetworkFirst
// route above only has a cache entry for paths that were actually
// visited while online, so a route requested for the first time while
// offline (a bookmark, a typed URL, a deep link) would otherwise fail
// outright instead of loading the shell. workbox-build inlines this
// plugin's function body into the generated service worker, the same
// way it inlines the urlPattern predicates above.
//
// Reaches the service worker's `caches` global through `globalThis`
// with a minimal inline type, rather than the ambient `self`/`caches`
// declarations — this file is also imported (for the predicates above)
// by vite.config.ts, whose Node-only tsconfig has no DOM/service-worker
// lib, so it can't resolve those ambient types.
export const appShellOfflineFallbackPlugin = {
  handlerDidError: async () => {
    const cacheStorage = (
      globalThis as {
        caches?: { match: (request: string) => Promise<Response | undefined> }
      }
    ).caches
    const cached = await cacheStorage?.match('/index.html')
    return cached ?? Response.error()
  },
}
