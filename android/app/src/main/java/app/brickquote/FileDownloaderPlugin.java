package app.brickquote;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.webkit.CookieManager;
import android.widget.Toast;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FileDownloader")
public class FileDownloaderPlugin extends Plugin {
    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "download.pdf");

        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));

            // Pass cookies so authenticated downloads work
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) {
                request.addRequestHeader("Cookie", cookies);
            }

            request.setTitle(fileName);
            request.setDescription("Downloading " + fileName);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

            DownloadManager dm = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            dm.enqueue(request);

            Toast.makeText(getContext(), "Saved to Downloads: " + fileName, Toast.LENGTH_SHORT).show();
            call.resolve();
        } catch (Exception e) {
            call.reject("Download failed: " + e.getMessage());
        }
    }
}
