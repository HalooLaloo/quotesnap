import Capacitor
import UIKit

@objc(FileDownloaderPlugin)
public class FileDownloaderPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FileDownloaderPlugin"
    public let jsName = "FileDownloader"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "download", returnType: CAPPluginReturnPromise)
    ]

    @objc func download(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("URL is required")
            return
        }

        let fileName = call.getString("fileName") ?? "download.pdf"

        // Get cookies from WKWebView for auth
        DispatchQueue.main.async {
            let cookieStore = self.bridge?.webView?.configuration.websiteDataStore.httpCookieStore
            cookieStore?.getAllCookies { cookies in
                var request = URLRequest(url: url)
                let cookieHeader = cookies.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
                request.setValue(cookieHeader, forHTTPHeaderField: "Cookie")

                URLSession.shared.dataTask(with: request) { data, response, error in
                    if let error = error {
                        call.reject(error.localizedDescription)
                        return
                    }

                    guard let data = data,
                          let httpResponse = response as? HTTPURLResponse,
                          httpResponse.statusCode == 200 else {
                        call.reject("Download failed")
                        return
                    }

                    // Save to temp directory
                    let tempDir = FileManager.default.temporaryDirectory
                    let fileURL = tempDir.appendingPathComponent(fileName)

                    do {
                        try data.write(to: fileURL)
                    } catch {
                        call.reject("Failed to save file")
                        return
                    }

                    // Present share sheet to open/save PDF
                    DispatchQueue.main.async {
                        let activityVC = UIActivityViewController(
                            activityItems: [fileURL],
                            applicationActivities: nil
                        )

                        if let viewController = self.bridge?.viewController {
                            if let popover = activityVC.popoverPresentationController {
                                popover.sourceView = viewController.view
                                popover.sourceRect = CGRect(x: viewController.view.bounds.midX, y: viewController.view.bounds.midY, width: 0, height: 0)
                            }
                            viewController.present(activityVC, animated: true)
                        }

                        call.resolve()
                    }
                }.resume()
            }
        }
    }
}
