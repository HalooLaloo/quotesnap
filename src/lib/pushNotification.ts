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

export async function sendPushNotification(options: PushOptions): Promise<void> {
  try {
    const admin = await getFirebaseAdmin()
    if (!admin) return

    // Get FCM token from Supabase
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

    const token = profile?.fcm_token
    if (!token) return

    await admin.messaging().send({
      token,
      notification: {
        title: options.title,
        body: options.body,
      },
      data: options.data || {},
      android: {
        priority: 'high',
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
    // If token is invalid, clear it from DB
    const err = error as { code?: string }
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        await supabase
          .from('profiles')
          .update({ fcm_token: null })
          .eq('id', options.userId)
      } catch {
        // ignore cleanup errors
      }
    }
    // Don't throw — push is best-effort, never block the main flow
  }
}
