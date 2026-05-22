const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateBase32Secret(length = 20): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += BASE32[bytes[i] % 32]
  }
  return result
}

function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.replace(/[^A-Z2-7]/gi, '').toUpperCase()
  const bytes: number[] = []
  let buffer = 0
  let bitsLeft = 0

  for (const char of cleaned) {
    const val = BASE32.indexOf(char)
    if (val === -1) continue
    buffer = (buffer << 5) | val
    bitsLeft += 5
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff)
      bitsLeft -= 8
    }
  }

  return new Uint8Array(bytes)
}

function intTo8Bytes(num: number): Uint8Array {
  const buf = new Uint8Array(8)
  for (let i = 7; i >= 0; i--) {
    buf[i] = num & 0xff
    num >>>= 8
  }
  return buf
}

function truncatedValue(hmac: Uint8Array): number {
  const offset = hmac[hmac.length - 1] & 0xf
  return ((hmac[offset] & 0x7f) << 24) |
         ((hmac[offset + 1] & 0xff) << 16) |
         ((hmac[offset + 2] & 0xff) << 8) |
         (hmac[offset + 3] & 0xff)
}

export async function generateTOTP(secret: string, windowOffset = 0): Promise<string> {
  const keyBytes = base32Decode(secret)
  const counter = Math.floor(Date.now() / 1000 / 30) + windowOffset
  const counterBytes = intTo8Bytes(counter)

  const key = await crypto.subtle.importKey(
    'raw', keyBytes.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-1' },
    false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, counterBytes.buffer as ArrayBuffer)
  const hmac = new Uint8Array(signature)
  const value = truncatedValue(hmac)
  return String(value % 1_000_000).padStart(6, '0')
}

export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const token = code.trim().replace(/\s/g, '')
  if (!/^\d{6}$/.test(token)) return false

  for (let offset = -1; offset <= 1; offset++) {
    const expected = await generateTOTP(secret, offset)
    if (expected === token) return true
  }
  return false
}
