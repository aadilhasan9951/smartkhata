package com.smartkhata.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WhatsAppShare")
public class WhatsAppShare extends Plugin {

    @PluginMethod
    public void shareImage(PluginCall call) {
        try {
            String imageData = call.getString("imageData"); // Base64 string
            String message = call.getString("message", "");
            
            // Remove data:image/png;base64, prefix if present
            if (imageData.startsWith("data:image")) {
                imageData = imageData.substring(imageData.indexOf(",") + 1);
            }
            
            // Decode Base64 to bytes
            byte[] imageBytes = Base64.decode(imageData, Base64.DEFAULT);
            
            // Save to cache directory
            File cacheDir = getContext().getCacheDir();
            File imageFile = new File(cacheDir, "balance_share.png");
            FileOutputStream fos = new FileOutputStream(imageFile);
            fos.write(imageBytes);
            fos.close();
            
            // Use FileProvider to get content:// URI (required for Android 10+)
            Uri imageUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                imageFile
            );
            
            // Create WhatsApp intent
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("image/png");
            intent.putExtra(Intent.EXTRA_STREAM, imageUri);
            intent.putExtra(Intent.EXTRA_TEXT, message);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            // Set WhatsApp package if available
            intent.setPackage("com.whatsapp");
            
            // Start activity
            getActivity().startActivity(Intent.createChooser(intent, "Share via WhatsApp"));
            
            call.resolve();
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Error sharing image: " + e.getMessage());
        }
    }
}
