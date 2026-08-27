import AsyncStorage from '@react-native-async-storage/async-storage'
import * as aesjs from 'aes-js'
import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

const ENCRYPTION_KEY_STORAGE_KEY = 'sb-session-encryption-key'
const AES_KEY_BYTE_LENGTH = 32 // AES-256
const COUNTER_BYTE_LENGTH = 16 // AES block size

let cachedEncryptionKey: Uint8Array | null = null

// The encryption key itself lives only in expo-secure-store (iOS Keychain /
// Android Keystore) — never in AsyncStorage alongside the ciphertext it
// protects. Generated once per device install, then reused.
async function getEncryptionKey(): Promise<Uint8Array> {
  if (cachedEncryptionKey) return cachedEncryptionKey

  const stored = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY)
  if (stored) {
    cachedEncryptionKey = aesjs.utils.hex.toBytes(stored)
    return cachedEncryptionKey
  }

  const newKey = await Crypto.getRandomBytesAsync(AES_KEY_BYTE_LENGTH)
  await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, aesjs.utils.hex.fromBytes(newKey))
  cachedEncryptionKey = newKey
  return newKey
}

// Supabase's SupportedStorage-compatible adapter (Phase 19 hardening): the
// session blob — which includes the long-lived refresh token — is AES-256-CTR
// encrypted before being persisted to AsyncStorage. AsyncStorage itself has
// no encryption at rest (plain SharedPreferences XML on Android, a plist on
// iOS), and expo-secure-store alone can't hold the session directly since
// Keychain/Keystore-backed storage has a small per-item size limit the
// session blob can exceed. This is Supabase's own documented pattern for
// Expo apps: a small key in SecureStore, the large encrypted blob in
// AsyncStorage.
export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key)
    if (!stored) return null

    // Anything that fails to decode/decrypt here — most notably a
    // plaintext session written by the pre-encryption version of this
    // adapter, on a device upgrading from an earlier build — is treated
    // the same as "no session" rather than thrown: Supabase then simply
    // asks the devotee to sign in again, instead of the app hanging on
    // an unhandled rejection during session restore.
    try {
      const encryptionKey = await getEncryptionKey()
      const combined = aesjs.utils.hex.toBytes(stored)
      const counterBytes = combined.slice(0, COUNTER_BYTE_LENGTH)
      const ciphertext = combined.slice(COUNTER_BYTE_LENGTH)

      const aesCtr = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(counterBytes))
      const plaintextBytes = aesCtr.decrypt(ciphertext)
      return aesjs.utils.utf8.fromBytes(plaintextBytes)
    } catch {
      await AsyncStorage.removeItem(key)
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = await getEncryptionKey()
    // A fresh random counter (nonce) per write — CTR mode is only secure
    // when the same (key, counter) pair is never reused to encrypt two
    // different plaintexts.
    const counterBytes = await Crypto.getRandomBytesAsync(COUNTER_BYTE_LENGTH)

    const aesCtr = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(counterBytes))
    const ciphertext = aesCtr.encrypt(aesjs.utils.utf8.toBytes(value))

    const combined = new Uint8Array(COUNTER_BYTE_LENGTH + ciphertext.length)
    combined.set(counterBytes, 0)
    combined.set(ciphertext, COUNTER_BYTE_LENGTH)
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(combined))
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
  },
}
