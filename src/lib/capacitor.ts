import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'
import { createClient } from '@/lib/supabase/client'

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
    PushNotifications.addListener('registration', async (token) => {
      await saveFcmToken(token.value)
    })

    PushNotifications.addListener('registrationError', () => {
      // Silent fail — push is best-effort
    })

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', () => {
      // Notification is shown automatically by the system
    })

    // User tapped on notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const url = notification.notification.data?.url
      if (url && typeof url === 'string') {
        window.location.href = url
      }
    })
  } catch {
    // Push not available on this device
  }
}

async function saveFcmToken(token: string) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', user.id)
  } catch {
    // Silent fail
  }
}

export const isNative = () => Capacitor.isNativePlatform()
