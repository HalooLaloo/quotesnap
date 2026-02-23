import crypto from 'crypto'

const HMAC_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret'

/** Generate HMAC token for unsubscribe link */
export function generateUnsubscribeToken(userId: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(userId).digest('hex').slice(0, 16)
}

/** Verify HMAC token for unsubscribe link */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId)
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

/** Generate unsubscribe footer HTML for emails */
export function emailUnsubscribeFooter(userId: string, appUrl: string): string {
  const token = generateUnsubscribeToken(userId)
  const unsubscribeUrl = `${appUrl}/unsubscribe?uid=${userId}&t=${token}`
  return `<p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
    <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> from email notifications
  </p>`
}
