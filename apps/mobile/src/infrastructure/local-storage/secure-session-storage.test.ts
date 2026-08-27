jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>()
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value)
    }),
    __store: store,
  }
})

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => {
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    return bytes
  }),
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

import { secureSessionStorage } from './secure-session-storage'

describe('secureSessionStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    ;(SecureStore.getItemAsync as jest.Mock).mockClear()
    ;(SecureStore.setItemAsync as jest.Mock).mockClear()
  })

  it('returns null when nothing has been stored for a key', async () => {
    expect(await secureSessionStorage.getItem('sb-session')).toBeNull()
  })

  it('round-trips the exact original value through setItem/getItem', async () => {
    const session = JSON.stringify({ access_token: 'a.b.c', refresh_token: 'r1', user: { id: 'u1' } })

    await secureSessionStorage.setItem('sb-session', session)

    expect(await secureSessionStorage.getItem('sb-session')).toBe(session)
  })

  it('never stores the plaintext value in AsyncStorage', async () => {
    const session = 'super-secret-refresh-token-value'

    await secureSessionStorage.setItem('sb-session', session)
    const rawStored = await AsyncStorage.getItem('sb-session')

    expect(rawStored).not.toBeNull()
    expect(rawStored).not.toContain(session)
  })

  it('removeItem deletes the stored value', async () => {
    await secureSessionStorage.setItem('sb-session', 'value')
    await secureSessionStorage.removeItem('sb-session')

    expect(await secureSessionStorage.getItem('sb-session')).toBeNull()
  })

  it('generates the encryption key only once per process and reuses it across calls', async () => {
    // In-process module state (cachedEncryptionKey) persists across earlier
    // tests in this file, same as it would across screens in the running
    // app — reset the module registry to observe a true cold start, and
    // re-require both the module under test and its mocked dependency so
    // the assertion targets the fresh instances actually used below.
    jest.resetModules()
    const freshSecureStore = require('expo-secure-store')
    const freshStorage = require('./secure-session-storage').secureSessionStorage

    await freshStorage.setItem('sb-session', 'first')
    await freshStorage.setItem('sb-session', 'second')
    await freshStorage.getItem('sb-session')

    expect(freshSecureStore.setItemAsync).toHaveBeenCalledTimes(1)
  })

  it('treats a pre-existing plaintext value (from before this adapter existed) as no session, without throwing', async () => {
    // Reproduces a real bug caught on-device: a session persisted by the
    // old, unencrypted AsyncStorage-only adapter is plain JSON, not hex —
    // decoding it must fail closed (null), not throw and hang the app's
    // auth-loading state.
    const legacyPlaintextSession = JSON.stringify({ access_token: 'a.b.c', refresh_token: 'r1' })
    await AsyncStorage.setItem('sb-session', legacyPlaintextSession)

    await expect(secureSessionStorage.getItem('sb-session')).resolves.toBeNull()
  })

  it('clears the stale entry after failing to decrypt it, so it is not retried forever', async () => {
    await AsyncStorage.setItem('sb-session', 'not-valid-hex-ciphertext')

    await secureSessionStorage.getItem('sb-session')

    expect(await AsyncStorage.getItem('sb-session')).toBeNull()
  })

  it('produces different ciphertext for the same value on repeated writes (random nonce)', async () => {
    await secureSessionStorage.setItem('sb-session', 'same-value')
    const first = await AsyncStorage.getItem('sb-session')

    await secureSessionStorage.setItem('sb-session', 'same-value')
    const second = await AsyncStorage.getItem('sb-session')

    expect(first).not.toBe(second)
  })
})
