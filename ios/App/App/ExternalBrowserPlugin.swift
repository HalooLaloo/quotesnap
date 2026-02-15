import Capacitor
import UIKit

@objc(ExternalBrowserPlugin)
public class ExternalBrowserPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ExternalBrowserPlugin"
    public let jsName = "ExternalBrowser"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    @objc func open(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("URL is required")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Failed to open URL")
                }
            }
        }
    }
}
