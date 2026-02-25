/**
 * APNs (Apple Push Notification Service) utility
 *
 * Sends push notifications to iOS devices via APNs HTTP/2 API
 * using provider token (JWT) authentication.
 *
 * Required env vars:
 *   APNS_KEY_ID       - Key ID from Apple Developer Portal
 *   APNS_TEAM_ID      - Team ID from Apple Developer Account
 *   APNS_KEY_BASE64   - .p8 private key file contents, base64 encoded
 *   APNS_BUNDLE_ID    - App bundle identifier (e.g. com.understood.app)
 *   APNS_ENVIRONMENT  - "production" or "development" (defaults to "production")
 */

import * as crypto from 'crypto'
import * as http2 from 'http2'

const APNS_HOST_PRODUCTION = 'api.push.apple.com'
const APNS_HOST_DEVELOPMENT = 'api.sandbox.push.apple.com'

// Cache JWT tokens (valid for 1 hour, refresh at 50 minutes)
let cachedToken: { jwt: string; createdAt: number } | null = null
const TOKEN_TTL_MS = 50 * 60 * 1000 // 50 minutes

function getAPNsHost(): string {
  const env = process.env.APNS_ENVIRONMENT || 'production'
  return env === 'development' ? APNS_HOST_DEVELOPMENT : APNS_HOST_PRODUCTION
}

function createJWT(): string {
  const keyId = process.env.APNS_KEY_ID
  const teamId = process.env.APNS_TEAM_ID
  const keyBase64 = process.env.APNS_KEY_BASE64

  if (!keyId || !teamId || !keyBase64) {
    throw new Error('Missing APNs configuration: APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_BASE64')
  }

  // Check cache
  if (cachedToken && Date.now() - cachedToken.createdAt < TOKEN_TTL_MS) {
    return cachedToken.jwt
  }

  const key = Buffer.from(keyBase64, 'base64').toString('utf-8')

  // Build JWT header and payload
  const header = Buffer.from(JSON.stringify({
    alg: 'ES256',
    kid: keyId,
  })).toString('base64url')

  const payload = Buffer.from(JSON.stringify({
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url')

  const signingInput = `${header}.${payload}`

  // Sign with ES256 (ECDSA with P-256 and SHA-256)
  const sign = crypto.createSign('SHA256')
  sign.update(signingInput)
  const derSignature = sign.sign(key)

  // Convert DER to raw r||s format for JWT
  const rawSignature = derToRaw(derSignature)
  const signature = rawSignature.toString('base64url')

  const jwt = `${signingInput}.${signature}`

  cachedToken = { jwt, createdAt: Date.now() }
  return jwt
}

/**
 * Convert DER-encoded ECDSA signature to raw r||s format
 */
function derToRaw(derSig: Buffer): Buffer {
  // DER: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  let offset = 2 // skip 0x30 and total length

  // Read r
  offset++ // skip 0x02
  let rLen = derSig[offset++]
  let r = derSig.subarray(offset, offset + rLen)
  offset += rLen

  // Read s
  offset++ // skip 0x02
  let sLen = derSig[offset++]
  let s = derSig.subarray(offset, offset + sLen)

  // Pad or trim to 32 bytes each
  r = padOrTrim(r, 32)
  s = padOrTrim(s, 32)

  return Buffer.concat([r, s])
}

function padOrTrim(buf: Buffer, len: number): Buffer {
  if (buf.length === len) return buf
  if (buf.length > len) return buf.subarray(buf.length - len)
  const padded = Buffer.alloc(len)
  buf.copy(padded, len - buf.length)
  return padded
}

interface APNsPayload {
  title: string
  body: string
  category?: string
  data?: Record<string, string>
}

interface APNsSendResult {
  deviceToken: string
  success: boolean
  statusCode?: number
  reason?: string
}

/**
 * Send a push notification to a single iOS device
 */
export function sendAPNsNotification(
  deviceToken: string,
  payload: APNsPayload
): Promise<APNsSendResult> {
  return new Promise((resolve) => {
    try {
      const jwt = createJWT()
      const bundleId = process.env.APNS_BUNDLE_ID

      if (!bundleId) {
        resolve({ deviceToken, success: false, reason: 'Missing APNS_BUNDLE_ID' })
        return
      }

      const apnsPayload = JSON.stringify({
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: 'default',
          ...(payload.category ? { category: payload.category } : {}),
        },
        ...(payload.data || {}),
      })

      const host = getAPNsHost()
      const client = http2.connect(`https://${host}`)

      client.on('error', (err) => {
        console.error('APNs HTTP/2 connection error:', err)
        resolve({ deviceToken, success: false, reason: err.message })
      })

      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        'authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      })

      req.setEncoding('utf8')
      let responseBody = ''
      let statusCode: number | undefined

      req.on('response', (headers) => {
        statusCode = headers[':status'] as number
      })

      req.on('data', (chunk) => {
        responseBody += chunk
      })

      req.on('end', () => {
        client.close()
        if (statusCode === 200) {
          resolve({ deviceToken, success: true, statusCode })
        } else {
          let reason = `HTTP ${statusCode}`
          try {
            const parsed = JSON.parse(responseBody)
            reason = parsed.reason || reason
          } catch {}
          resolve({ deviceToken, success: false, statusCode, reason })
        }
      })

      req.on('error', (err) => {
        client.close()
        resolve({ deviceToken, success: false, reason: err.message })
      })

      req.write(apnsPayload)
      req.end()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      resolve({ deviceToken, success: false, reason: message })
    }
  })
}

/**
 * Send a push notification to multiple iOS devices
 */
export async function sendAPNsToDevices(
  deviceTokens: string[],
  payload: APNsPayload
): Promise<APNsSendResult[]> {
  const results = await Promise.all(
    deviceTokens.map(token => sendAPNsNotification(token, payload))
  )
  return results
}
