jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

jest.mock('@sadhana-connect/infra-supabase', () => ({
  initSupabaseClient: jest.fn(),
  getSupabaseClient: jest.fn(),
}))

jest.mock('./src/shared/config/env', () => ({
  env: {
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

import { act, create } from 'react-test-renderer'
import { getSupabaseClient, initSupabaseClient } from '@sadhana-connect/infra-supabase'

import App from './App'

const mockInitSupabaseClient = initSupabaseClient as jest.Mock
const mockGetSupabaseClient = getSupabaseClient as jest.Mock

describe('App', () => {
  beforeEach(() => {
    mockGetSupabaseClient.mockReset()
  })

  it('initializes the Supabase client once at startup', () => {
    expect(mockInitSupabaseClient).toHaveBeenCalledTimes(1)
  })

  it('shows the connected state once the session check resolves with no session', async () => {
    mockGetSupabaseClient.mockReturnValue({
      auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    })

    let root: ReturnType<typeof create> | undefined
    await act(async () => {
      root = create(<App />)
    })

    expect(JSON.stringify(root!.toJSON())).toContain('Connected — no active session')
  })

  it('shows the signed-in email once the session check resolves with a session', async () => {
    mockGetSupabaseClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { email: 'devotee@example.com' } } },
          error: null,
        }),
      },
    })

    let root: ReturnType<typeof create> | undefined
    await act(async () => {
      root = create(<App />)
    })

    expect(JSON.stringify(root!.toJSON())).toContain('devotee@example.com')
  })
})
