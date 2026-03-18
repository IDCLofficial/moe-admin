'use server'

/**
 * API response funnel: server actions to decrypt encrypted API responses into typed data.
 * The key (API_RESPONSE_DECRYPT_SECRET) is only read on the server; callers can be client or server.
 * Same secret must be used by the backend when encrypting responses.
 *
 * Throws at module load on the server if API_RESPONSE_DECRYPT_SECRET is missing or too short,
 * so deployment without the key fails immediately.
 */

const ENV_KEY = 'API_RESPONSE_DECRYPT_SECRET'
const MIN_SECRET_LEN = 8

const secret =
  typeof process !== 'undefined' ? process.env[ENV_KEY] ?? '' : ''
const secretStr = String(secret).trim()

const isServer = typeof process !== 'undefined' && typeof window === 'undefined'
if (isServer && (!secretStr || secretStr.length < MIN_SECRET_LEN)) {
  throw new Error(
    `${ENV_KEY} is not set or too short (min ${MIN_SECRET_LEN} chars). Set it in the server environment to use API response decryption.`
  )
}

const SALT = 'mope-api-response-funnel-v1'
const SALT_BYTES = new TextEncoder().encode(SALT)
// Key algorithm
const KEY_ALG = { name: 'PBKDF2', hash: 'SHA-256', iterations: 120_000 }

// AES-GCM algorithm
const AES_ALG = { name: 'AES-GCM', length: 256 }

// IV bytes and GCM tag bits
const IV_BYTES = 12

// GCM tag bits
const GCM_TAG_BITS = 128

let cachedKey: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (!secretStr || secretStr.length < MIN_SECRET_LEN) {
    throw new Error(`${ENV_KEY} is not configured. API response decryption is server-only.`)
  }
  if (cachedKey) return cachedKey
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretStr),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  cachedKey = await crypto.subtle.deriveKey(
    { ...KEY_ALG, salt: SALT_BYTES },
    keyMaterial,
    AES_ALG,
    false,
    ['decrypt']
  )
  return cachedKey
}

/**
 * Decrypt an encrypted API response payload (base64 IV||ciphertext) and parse as JSON.
 * Key is derived once and cached for speed.
 */
export async function decryptApiResponse<T>(encryptedPayload: string): Promise<T> {
  const payload = encryptedPayload.trim()
  let combined: Uint8Array
  try {
    const binary = atob(payload)
    combined = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) combined[i] = binary.charCodeAt(i)
  } catch {
    throw new Error('apiResponseFunnel: invalid base64 in encrypted payload')
  }
  if (combined.length < IV_BYTES + 16) {
    throw new Error('apiResponseFunnel: payload too short to be valid')
  }

  const iv = combined.slice(0, IV_BYTES)
  const cipher = combined.slice(IV_BYTES)
  const key = await getKey()

  let plain: ArrayBuffer
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: GCM_TAG_BITS },
      key,
      cipher
    )
  } catch (e) {
    throw new Error(
      `apiResponseFunnel: decryption failed (wrong key or corrupted payload): ${e instanceof Error ? e.message : String(e)}`
    )
  }

  const text = new TextDecoder().decode(plain)
  try {
    return JSON.parse(text) as T
  } catch (e) {
    throw new Error(
      `apiResponseFunnel: decrypted payload is not valid JSON: ${e instanceof Error ? e.message : String(e)}`
    )
  }
}

/**
 * Check if the env key is configured (always true if module loaded; kept for API compatibility).
 */
export async function isApiResponseDecryptConfigured(): Promise<boolean> {
  return secretStr.length >= MIN_SECRET_LEN
}

/**
 * Decrypt when the API returns an object with an encrypted field (e.g. { data: "<base64>" }).
 */
export async function decryptApiResponseFrom<T>(
  response: Record<string, unknown>,
  payloadKey: string = 'data'
): Promise<T> {
  const raw = response[payloadKey]
  if (typeof raw !== 'string') {
    throw new Error(`apiResponseFunnel: expected string at response.${payloadKey}`)
  }
  return decryptApiResponse<T>(raw)
}
