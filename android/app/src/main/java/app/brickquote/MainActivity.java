package app.brickquote;

import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
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

        // Keep ALL navigation in WebView
        getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Return false = WebView handles it (stays in app)
                return false;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Return false = WebView handles it (stays in app)
                return false;
            }
        });
    }
}
