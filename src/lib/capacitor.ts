import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Network } from '@capacitor/network'
import { Share } from '@capacitor/share'
import { createClient } from '@/lib/supabase/client'

/**
 * Minimal native bridge for Capacitor remote URL mode.
 * When server.url points to a remote URL, the full bridge JS may not be injected,
 * so nativeCallback/nativePromise are unavailable. This implements direct communication
 * with the native bridge (Android: androidBridge, iOS: webkit.messageHandlers.bridge).
 */
function setupNativeBridge() {
  if (typeof window === 'undefined') return
  const cap = (window as any).Capacitor as any
  if (!cap || !cap.isNativePlatform?.()) return

  // If nativePromise already exists, bridge JS was injected — no need for polyfill
  if (typeof cap.nativePromise === 'function') return

  // Detect platform bridge
  const androidBridge = (window as any).androidBridge
  const iosBridge = (window as any).webkit?.messageHandlers?.bridge

  if (!androidBridge && !iosBridge) return

  function postToNative(msg: string) {
    if (androidBridge?.postMessage) {
      androidBridge.postMessage(msg)
    } else if (iosBridge?.postMessage) {
      iosBridge.postMessage(msg)
    }
  }

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
      try {
        postToNative(msg)
      } catch {
        callbacks.delete(callbackId)
        reject(new Error('Native bridge not available'))
      }
    })
  }

  cap.nativeCallback = (pluginId: string, methodName: string, options: any, callback?: any) => {
    const callbackId = `cb_${++callbackCounter}`
    callbacks.set(callbackId, {
      resolve: (data: any) => callback?.(data),
      reject: (err: any) => callback?.(null, err),
    })
    const msg = JSON.stringify({ callbackId, pluginId, methodName, options: options || {} })
    try {
      postToNative(msg)
    } catch {
      // Silent fail
    }
    return { callbackId, remove: () => { callbacks.delete(callbackId) } }
  }

  // Set PluginHeaders so registerPlugin creates native proxies
  if (!cap.PluginHeaders) {
    cap.PluginHeaders = [
      {
        name: 'PushNotifications',
        methods: [
          { name: 'checkPermissions', rtype: 'promise' },
          { name: 'requestPermissions', rtype: 'promise' },
          { name: 'register', rtype: 'promise' },
          { name: 'unregister', rtype: 'promise' },
          { name: 'getDeliveredNotifications', rtype: 'promise' },
          { name: 'removeDeliveredNotifications', rtype: 'promise' },
          { name: 'removeAllDeliveredNotifications', rtype: 'promise' },
          { name: 'createChannel', rtype: 'promise' },
          { name: 'deleteChannel', rtype: 'promise' },
          { name: 'listChannels', rtype: 'promise' },
          { name: 'addListener' },
          { name: 'removeListener' },
          { name: 'removeAllListeners', rtype: 'promise' },
        ],
      },
      {
        name: 'FileDownloader',
        methods: [
          { name: 'download', rtype: 'promise' },
        ],
      },
      {
        name: 'ExternalBrowser',
        methods: [
          { name: 'open', rtype: 'promise' },
        ],
      },
      {
        name: 'Browser',
        methods: [
          { name: 'open', rtype: 'promise' },
          { name: 'close', rtype: 'promise' },
          { name: 'addListener' },
          { name: 'removeAllListeners', rtype: 'promise' },
        ],
      },
      {
        name: 'Haptics',
        methods: [
          { name: 'impact', rtype: 'promise' },
          { name: 'notification', rtype: 'promise' },
          { name: 'vibrate', rtype: 'promise' },
        ],
      },
      {
        name: 'Network',
        methods: [
          { name: 'getStatus', rtype: 'promise' },
          { name: 'addListener' },
          { name: 'removeAllListeners', rtype: 'promise' },
        ],
      },
      {
        name: 'Share',
        methods: [
          { name: 'share', rtype: 'promise' },
          { name: 'canShare', rtype: 'promise' },
        ],
      },
    ]
  }
}

// Must run before any registerPlugin calls
setupNativeBridge()

import { registerPlugin } from '@capacitor/core'
const PushNotifications: any = registerPlugin('PushNotifications')
export const FileDownloader: any = registerPlugin('FileDownloader')
export const ExternalBrowser: any = registerPlugin('ExternalBrowser')

export function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return

  StatusBar.setStyle({ style: Style.Dark })
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: '#0a1628' })
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      App.exitApp()
    }
  })

  // Handle deep links — navigate WebView to the opened URL
  App.addListener('appUrlOpen', (event: { url: string }) => {
    try {
      const url = new URL(event.url)
      // Only navigate for our own domain
      if (url.hostname.includes('brickquote.app')) {
        window.location.href = url.pathname + url.search
      }
    } catch {
      // Invalid URL — ignore
    }
  })

  // Monitor network status — show offline page when disconnected
  Network.addListener('networkStatusChange', (status) => {
    if (!status.connected) {
      window.location.href = '/offline.html'
    }
  })

  // Initialize push notifications
  initPushNotifications()
}

// Native haptic feedback
export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!Capacitor.isNativePlatform()) return
  try {
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
    await Haptics.impact({ style: map[style] })
  } catch { /* silent */ }
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isNativePlatform()) return
  try {
    const map = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error }
    await Haptics.notification({ type: map[type] })
  } catch { /* silent */ }
}

// Native share sheet
export async function nativeShare(opts: { title: string; text?: string; url: string }): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    await Share.share(opts)
    return true
  } catch {
    return false
  }
}

async function initPushNotifications() {
  // Wait for user to be logged in before registering push
  const supabase = createClient()
  let user: any = null

  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch {
    // Auth check failed
  }

  if (!user) {
    // Not logged in yet — listen for auth change and retry
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        initPushNotifications()
      }
    })
    return
  }

  // Clear FCM token on sign out so notifications don't go to wrong account
  supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_OUT') {
      await clearFcmToken(user.id)
    }
  })

  const platform = Capacitor.getPlatform() // 'android' | 'ios'

  // iOS: Firebase SDK injects FCM token via native AppDelegate.
  // This MUST run independently of Capacitor PushNotifications plugin
  // because the plugin bridge doesn't work in remote URL mode on iOS.
  if (platform === 'ios') {
    initIosPushToken(user.id)
  }

  // Android: Use Capacitor PushNotifications plugin
  if (platform === 'android') {
    try {
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') {
        return
      }

      PushNotifications.addListener('registration', async (token: any) => {
        await saveFcmToken(user.id, token.value, platform)
      })

      PushNotifications.addListener('registrationError', () => {
        // Registration failed — silent
      })

      await PushNotifications.register()

      PushNotifications.addListener('pushNotificationReceived', () => {
        // Notification is shown automatically by the system
      })

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
        const url = notification.notification.data?.url
        if (url && typeof url === 'string') {
          window.location.href = url
        }
      })
    } catch {
      // Capacitor bridge issue — silent fail
    }
  }
}

/**
 * iOS-specific push token handling.
 * Runs independently of Capacitor PushNotifications plugin.
 * Gets FCM token from AppDelegate injection (window.__fcmToken / fcmToken event).
 */
function initIosPushToken(userId: string) {
  let iosTokenSaved = false

  const saveIosToken = async (token: string) => {
    if (iosTokenSaved) return
    iosTokenSaved = true
    await saveFcmToken(userId, token, 'ios')
  }

  // Check if token was already injected before this code ran
  const existingToken = (window as any).__fcmToken
  if (existingToken) {
    saveIosToken(existingToken)
    return
  }

  // Listen for token injection from AppDelegate
  window.addEventListener('fcmToken', (e: Event) => {
    const token = (e as CustomEvent).detail
    if (token) saveIosToken(token)
  })

  // Fallback: poll for __fcmToken (timing race with AppDelegate injection)
  let pollCount = 0
  const poll = setInterval(() => {
    pollCount++
    const token = (window as any).__fcmToken
    if (token) {
      clearInterval(poll)
      saveIosToken(token)
    } else if (pollCount >= 30) {
      clearInterval(poll)
    }
  }, 2000)
}

interface StoredToken {
  t: string   // token
  p: string   // platform (android/ios)
}

function parseTokens(raw: string | null): StoredToken[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Old format: plain token string — migrate it
    if (raw.length > 10) return [{ t: raw, p: 'android' }]
  }
  return []
}

async function saveFcmToken(userId: string, token: string, platform: string) {
  try {
    const supabase = createClient()

    // Read current tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    const tokens = parseTokens(profile?.fcm_token)

    // Replace token for this platform, or add new
    const updated = tokens.filter(t => t.p !== platform)
    updated.push({ t: token, p: platform })

    await supabase
      .from('profiles')
      .update({ fcm_token: JSON.stringify(updated) })
      .eq('id', userId)
  } catch {
    // Silent fail
  }
}

async function clearFcmToken(userId: string) {
  try {
    const platform = Capacitor.getPlatform()
    const supabase = createClient()

    // Only remove this device's token, keep other devices
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    const tokens = parseTokens(profile?.fcm_token).filter(t => t.p !== platform)

    await supabase
      .from('profiles')
      .update({ fcm_token: tokens.length > 0 ? JSON.stringify(tokens) : null })
      .eq('id', userId)
  } catch {
    // Silent fail
  }
}

export const isNative = () => Capacitor.isNativePlatform()
