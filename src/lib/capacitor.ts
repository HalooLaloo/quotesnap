import { Capacitor, registerPlugin } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { createClient } from '@/lib/supabase/client'

// For remote URL mode (server.url), the native bridge doesn't inject PluginHeaders.
// We must set them BEFORE calling registerPlugin so it creates a native proxy.
const cap = Capacitor as any
if (typeof window !== 'undefined' && cap.isNativePlatform && cap.isNativePlatform() && !cap.PluginHeaders) {
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

// Register plugin ourselves — this creates a native bridge proxy
// using the PluginHeaders we set above
const PushNotifications: any = registerPlugin('PushNotifications')

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
  } catch (err) {
    // DEBUG: temporarily show errors
    if (typeof alert !== 'undefined') {
      alert('[PUSH ERROR] ' + (err instanceof Error ? err.message : String(err)))
    }
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
