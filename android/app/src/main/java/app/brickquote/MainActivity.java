package app.brickquote;

import android.webkit.CookieManager;
import android.webkit.WebView;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable cookies for auth (Supabase)
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);

        // Extend Capacitor's WebViewClient to keep navigation in app
        getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri uri = Uri.parse(url);
                String host = uri.getHost();

                // Keep these domains in WebView
                if (host != null && (
                    host.contains("brickquote.app") ||
                    host.contains("supabase.co") ||
                    host.contains("supabase.com")
                )) {
                    return false; // Stay in WebView
                }

                // Let parent handle other URLs (opens in browser)
                return super.shouldOverrideUrlLoading(view, url);
            }
        });
    }
}
