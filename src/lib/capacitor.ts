import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { createClient } from '@/lib/supabase/client'

/**
 * Minimal native bridge for Capacitor remote URL mode.
 * When server.url points to a remote URL, the full bridge JS may not be injected,
 * so nativeCallback/nativePromise are unavailable. This implements direct communication
 * with the androidBridge Java interface.
 */
function setupNativeBridge() {
  if (typeof window === 'undefined') return
  const cap = (window as any).Capacitor as any
  if (!cap || !cap.isNativePlatform?.()) return

  // If nativePromise already exists, bridge JS was injected — no need for polyfill
  if (typeof cap.nativePromise === 'function') return

  let callbackCounter = 0
  const callbacks = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>()

  // Handle responses from native
  cap.fromNative = (result: any) => {
    const callbackId = result.callbackId
    const cb = callbacks.get(callbackId)
    if (!cb) return
    if (!result.save) {
      callbacks.delete(callbackId)
    }
    if (result.success) {
      cb.resolve(result.data || {})
    } else {
      cb.reject(result.error || { message: 'Native call failed' })
    }
  }

  // Send message to native and get promise back
  cap.nativePromise = (pluginId: string, methodName: string, options: any) => {
    return new Promise((resolve, reject) => {
      const callbackId = `cb_${++callbackCounter}`
      callbacks.set(callbackId, { resolve, reject })
      const msg = JSON.stringify({ callbackId, pluginId, methodName, options: options || {} })
      const bridge = (window as any).androidBridge
      if (bridge?.postMessage) {
        bridge.postMessage(msg)
      } else {
        callbacks.delete(callbackId)
        reject(new Error('androidBridge not available'))
      }
    })
  }

  cap.nativeCallback = (pluginId: string, methodName: string, options: any, callback?: any) => {
    const callbackId = `cb_${++callbackCounter}`
    callbacks.set(callbackId, {
      resolve: (data: any) => callback?.(data),
      reject: () => {},
    })
    const msg = JSON.stringify({ callbackId, pluginId, methodName, options: options || {} })
    const bridge = (window as any).androidBridge
    if (bridge?.postMessage) {
      bridge.postMessage(msg)
    }
    return callbackId
  }

  // Set PluginHeaders so registerPlugin creates native proxies
  if (!cap.PluginHeaders) {
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

// Must run before any registerPlugin calls
setupNativeBridge()

import { registerPlugin } from '@capacitor/core'
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
