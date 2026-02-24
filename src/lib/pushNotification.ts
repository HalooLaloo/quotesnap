import { createClient } from '@supabase/supabase-js'

/**
 * Send a push notification to a user via Firebase Cloud Messaging.
 * Gracefully skips if Firebase is not configured or user has no FCM token.
 */

interface PushOptions {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
}

// Lazy-init Firebase Admin to avoid import errors when env vars are missing
let firebaseAdmin: typeof import('firebase-admin') | null = null
let initialized = false

async function getFirebaseAdmin() {
  if (initialized) return firebaseAdmin

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    initialized = true
    return null
  }

  try {
    const admin = (await import('firebase-admin')).default
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
    }
    firebaseAdmin = admin
  } catch {
    // Firebase Admin not available
  }

  initialized = true
  return firebaseAdmin
}

interface StoredToken {
  t: string
  p: string
}

function parseTokens(raw: string | null): StoredToken[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Old format: plain token string — treat as android
    if (raw.length > 10) return [{ t: raw, p: 'android' }]
  }
  return []
}

export async function sendPushNotification(options: PushOptions): Promise<void> {
  try {
    const admin = await getFirebaseAdmin()
    if (!admin) return

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', options.userId)
      .single()

    const tokens = parseTokens(profile?.fcm_token)
    if (tokens.length === 0) return

    const invalidTokens: string[] = []

    // Send to ALL registered devices
    await Promise.allSettled(
      tokens.map(async ({ t: token }) => {
        try {
          await admin.messaging().send({
            token,
            notification: {
              title: options.title,
              body: options.body,
            },
            data: options.data || {},
            android: {
              priority: 'high' as const,
              notification: {
                channelId: 'default',
                icon: 'ic_launcher',
                color: '#f97316',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          })
        } catch (error: unknown) {
          const err = error as { code?: string }
          if (
            err.code === 'messaging/invalid-registration-token' ||
            err.code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(token)
          }
        }
      })
    )

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      const validTokens = tokens.filter(t => !invalidTokens.includes(t.t))
      await supabase
        .from('profiles')
        .update({ fcm_token: validTokens.length > 0 ? JSON.stringify(validTokens) : null })
        .eq('id', options.userId)
    }
  } catch {
    // Don't throw — push is best-effort, never block the main flow
  }
}
