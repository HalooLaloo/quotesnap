import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { createClient } from '@/lib/supabase/client'

// Ensure Capacitor native bridge has PluginHeaders for remote URL mode.
// When server.url points to a remote URL, the bridge JS injection may not
// set PluginHeaders, causing plugins to report "not implemented".
function ensurePluginHeaders() {
  const cap = Capacitor as any
  if (cap.isNativePlatform() && !cap.PluginHeaders) {
    cap.PluginHeaders = [
      {
        name: 'PushNotifications',
        methods: [
          { name: 'checkPermissions' },
          { name: 'requestPermissions' },
          { name: 'register' },
          { name: 'unregister' },
          { name: 'getDeliveredNotifications' },
          { name: 'removeDeliveredNotifications' },
          { name: 'removeAllDeliveredNotifications' },
          { name: 'createChannel' },
          { name: 'deleteChannel' },
          { name: 'listChannels' },
        ],
      },
    ]
  }
}

ensurePluginHeaders()

// Import PushNotifications AFTER ensuring headers are set
// eslint-disable-next-line @typescript-eslint/no-var-requires
let PushNotifications: any = null

export function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return

  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setBackgroundColor({ color: '#0a1628' })

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      App.exitApp()
    }
  })

  // Initialize push notifications
  initPushNotifications()
}

async function initPushNotifications() {
  try {
    // Dynamic import to ensure PluginHeaders are set first
    if (!PushNotifications) {
      const mod = await import('@capacitor/push-notifications')
      PushNotifications = mod.PushNotifications
    }

    // Wait for user to be logged in before registering push
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Not logged in yet — listen for auth change and retry
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          initPushNotifications()
        }
      })
      return
    }

    // Check/request permission
    let permStatus = await PushNotifications.checkPermissions()

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }

    if (permStatus.receive !== 'granted') {
      return
    }

    // Register for push
    await PushNotifications.register()

    // Listen for registration token
    PushNotifications.addListener('registration', async (token: any) => {
      await saveFcmToken(user.id, token.value)
    })

    PushNotifications.addListener('registrationError', () => {
      // Silent fail — push is best-effort
    })

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', () => {
      // Notification is shown automatically by the system
    })

    // User tapped on notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
      const url = notification.notification.data?.url
      if (url && typeof url === 'string') {
        window.location.href = url
      }
    })
  } catch {
    // Push not available on this device
  }
}

async function saveFcmToken(userId: string, token: string) {
  try {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', userId)
  } catch {
    // Silent fail
  }
}

export const isNative = () => Capacitor.isNativePlatform()
