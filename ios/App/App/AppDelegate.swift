import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {

    var window: UIWindow?
    private var pendingFCMToken: String?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self

        // Always register for remote notifications to get APNs token → FCM token.
        // This works even before permission is granted (notifications just won't display).
        // Don't rely on Capacitor bridge which doesn't work in remote URL mode.
        application.registerForRemoteNotifications()

        // Request display permission separately
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in }

        return true
    }

    // APNs token received — give to Firebase for FCM registration
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    // Firebase Messaging delegate — FCM token received
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        pendingFCMToken = token
        attemptTokenInjection(attempt: 0)
    }

    private func attemptTokenInjection(attempt: Int) {
        guard let token = pendingFCMToken, attempt < 20 else { return }

        let delay: TimeInterval = attempt == 0 ? 2.0 : 2.0
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self = self else { return }
            guard let vc = self.window?.rootViewController as? CAPBridgeViewController,
                  let webView = vc.webView else {
                self.attemptTokenInjection(attempt: attempt + 1)
                return
            }

            let escaped = token.replacingOccurrences(of: "'", with: "\\'")
            // Inject token into WebView AND call API directly with session cookies
            let js = """
            (function() {
                if (document.readyState !== 'complete') return 'loading';
                window.__fcmToken = '\(escaped)';
                window.dispatchEvent(new CustomEvent('fcmToken', {detail: '\(escaped)'}));
                fetch('/api/save-fcm-token', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'same-origin',
                    body: JSON.stringify({token: '\(escaped)', platform: 'ios'})
                }).catch(function(){});
                return 'ok';
            })();
            """

            webView.evaluateJavaScript(js) { [weak self] result, error in
                let status = result as? String
                if error != nil || status != "ok" {
                    self?.attemptTokenInjection(attempt: attempt + 1)
                } else {
                    self?.pendingFCMToken = nil
                }
            }
        }
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// Handle foreground notifications
extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.badge, .sound, .banner])
    }
}
