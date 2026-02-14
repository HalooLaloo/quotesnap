package app.brickquote;

import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.webkit.CookieManager;
import android.widget.Toast;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "FileDownloader")
public class FileDownloaderPlugin extends Plugin {
    @PluginMethod
    public void download(PluginCall call) {
        String urlStr = call.getString("url");
        String fileName = call.getString("fileName", "download.pdf");

        if (urlStr == null || urlStr.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        // Run on background thread
        new Thread(() -> {
            try {
                URL url = new URL(urlStr);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();

                // Pass cookies for auth
                String cookies = CookieManager.getInstance().getCookie(urlStr);
                if (cookies != null) {
                    conn.setRequestProperty("Cookie", cookies);
                }

                conn.setRequestMethod("GET");
                conn.connect();

                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    getActivity().runOnUiThread(() -> call.reject("Server error: " + responseCode));
                    return;
                }

                // Save to app's external files dir (no permission needed)
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir != null && !dir.exists()) dir.mkdirs();
                File outFile = new File(dir, fileName);

                InputStream in = conn.getInputStream();
                FileOutputStream out = new FileOutputStream(outFile);
                byte[] buffer = new byte[8192];
                int len;
                while ((len = in.read(buffer)) != -1) {
                    out.write(buffer, 0, len);
                }
                out.close();
                in.close();
                conn.disconnect();

                // Open the PDF
                Uri fileUri = androidx.core.content.FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    outFile
                );

                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                intent.setDataAndType(fileUri, "application/pdf");
                intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);

                getActivity().runOnUiThread(() -> {
                    try {
                        getContext().startActivity(intent);
                        call.resolve();
                    } catch (Exception e) {
                        Toast.makeText(getContext(), "PDF saved: " + fileName, Toast.LENGTH_LONG).show();
                        call.resolve();
                    }
                });
            } catch (Exception e) {
                getActivity().runOnUiThread(() -> call.reject(e.getMessage()));
            }
        }).start();
    }
}
