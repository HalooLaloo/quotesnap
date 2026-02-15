package app.brickquote;

import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "ExternalBrowser")
public class ExternalBrowserPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null) {
            call.reject("URL is required");
            return;
        }

        // Create a generic http intent to find browser apps (excluding our own app)
        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("http://example.com"));
        List<ResolveInfo> browsers = getActivity().getPackageManager()
                .queryIntentActivities(browserIntent, 0);

        String myPackage = getActivity().getPackageName();
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));

        // Find a browser that isn't our app
        for (ResolveInfo info : browsers) {
            if (!info.activityInfo.packageName.equals(myPackage)) {
                intent.setComponent(new ComponentName(
                        info.activityInfo.packageName,
                        info.activityInfo.name
                ));
                break;
            }
        }

        getActivity().startActivity(intent);
        call.resolve();
    }
}
