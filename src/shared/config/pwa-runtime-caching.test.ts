import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  appShellOfflineFallbackPlugin,
  isNavigationRequest,
  isSupabaseRequest,
} from '@/shared/config/pwa-runtime-caching'

describe('isNavigationRequest', () => {
  it('matches a document navigation request', () => {
    expect(isNavigationRequest({ request: { mode: 'navigate' } as Request })).toBe(true)
  })

  it('does not match a non-navigation request (e.g. a script or API fetch)', () => {
    expect(isNavigationRequest({ request: { mode: 'cors' } as Request })).toBe(false)
    expect(isNavigationRequest({ request: { mode: 'no-cors' } as Request })).toBe(false)
  })
})

describe('isSupabaseRequest', () => {
  it('matches any *.supabase.co host, regardless of path', () => {
    expect(
      isSupabaseRequest({ url: new URL('https://example-project.supabase.co/auth/v1/token') }),
    ).toBe(true)
    expect(
      isSupabaseRequest({
        url: new URL('https://example-project.supabase.co/rest/v1/sadhana_reports'),
      }),
    ).toBe(true)
    expect(
      isSupabaseRequest({
        url: new URL('https://example-project.supabase.co/functions/v1/some-function'),
      }),
    ).toBe(true)
  })

  it('does not match a same-origin app request', () => {
    expect(isSupabaseRequest({ url: new URL('https://sadhana-connect.example/index.html') })).toBe(
      false,
    )
  })

  it('does not match an unrelated host that merely contains "supabase.co"', () => {
    expect(
      isSupabaseRequest({ url: new URL('https://not-supabase.co.evil.example/') }),
    ).toBe(false)
    expect(
      isSupabaseRequest({ url: new URL('https://evil.example/supabase.co') }),
    ).toBe(false)
  })
})

describe('appShellOfflineFallbackPlugin', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to the precached index.html when the network request errors', async () => {
    const shellResponse = new Response('<html>shell</html>')
    const matchMock = vi.fn().mockResolvedValue(shellResponse)
    vi.stubGlobal('caches', { match: matchMock })

    const result = await appShellOfflineFallbackPlugin.handlerDidError()

    expect(matchMock).toHaveBeenCalledWith('/index.html')
    expect(result).toBe(shellResponse)
  })

  it('returns an error response if even the precache has no shell entry', async () => {
    vi.stubGlobal('caches', { match: vi.fn().mockResolvedValue(undefined) })

    const result = await appShellOfflineFallbackPlugin.handlerDidError()

    expect(result).toBeInstanceOf(Response)
    expect(result?.ok).toBe(false)
  })
})
