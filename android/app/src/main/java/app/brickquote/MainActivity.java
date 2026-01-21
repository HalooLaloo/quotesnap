package app.brickquote;

import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable cookies for auth
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);

        // Keep all navigation in WebView
        getBridge().getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Return false = let WebView handle it (stay in app)
                return false;
            }
        });
    }
}
