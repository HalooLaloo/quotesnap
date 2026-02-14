package app.brickquote;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FileDownloaderPlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        // Enable cookies for auth (Supabase)
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // WebView settings for input
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        // Focus handling
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();

        // Download listener - handles file downloads (PDF export etc.)
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));

            // Use filename from Content-Disposition header or generate from URL
            String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);

            // Pass cookies so authenticated downloads work
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) {
                request.addRequestHeader("Cookie", cookies);
            }
            request.addRequestHeader("User-Agent", userAgent);

            request.setDescription("Downloading " + fileName);
            request.setTitle(fileName);
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            dm.enqueue(request);

            Toast.makeText(getApplicationContext(), "Downloading " + fileName, Toast.LENGTH_SHORT).show();
        });
    }
}
