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
    alert('[DEBUG] Push init started, isNative=' + Capacitor.isNativePlatform())

    // Wait for user to be logged in before registering push
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('[DEBUG] No user yet, waiting for auth')
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          initPushNotifications()
        }
      })
      return
    }

    alert('[DEBUG] User found: ' + user.id)

    // Check/request permission
    let permStatus = await PushNotifications.checkPermissions()
    alert('[DEBUG] Permission status: ' + permStatus.receive)

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
      alert('[DEBUG] After request: ' + permStatus.receive)
    }

    if (permStatus.receive !== 'granted') {
      alert('[DEBUG] Permission not granted, stopping')
      return
    }

    // Register for push
    await PushNotifications.register()
    alert('[DEBUG] Register called')

    // Listen for registration token
    PushNotifications.addListener('registration', async (token) => {
      alert('[DEBUG] Got FCM token: ' + token.value.substring(0, 20) + '...')
      await saveFcmToken(user.id, token.value)
    })

    PushNotifications.addListener('registrationError', (err) => {
      alert('[DEBUG] Registration error: ' + JSON.stringify(err))
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
  } catch (err) {
    alert('[DEBUG] Push error: ' + (err instanceof Error ? err.message : String(err)))
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
