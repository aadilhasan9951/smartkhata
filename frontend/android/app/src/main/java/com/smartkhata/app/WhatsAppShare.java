package com.smartkhata.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
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
            String phone = call.getString("phone", "");
            
            // Remove data:image/png;base64, prefix if present
            if (imageData != null && imageData.startsWith("data:image")) {
                imageData = imageData.substring(imageData.indexOf(",") + 1);
            }
            
            // Decode Base64 to bytes
            byte[] imageBytes = Base64.decode(imageData, Base64.DEFAULT);
            
            // Save to external storage
            File externalDir = new File(Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_PICTURES), "SmartKhata");
            if (!externalDir.exists()) {
                externalDir.mkdirs();
            }
            File imageFile = new File(externalDir, "balance_share.png");
            FileOutputStream fos = new FileOutputStream(imageFile);
            fos.write(imageBytes);
            fos.close();
            
            // Use FileProvider to get content:// URI
            Uri imageUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                imageFile
            );
            
            // Clean phone number
            if (phone != null && !phone.isEmpty()) {
                phone = phone.replaceAll("[\\s\\-()]", "");
                if (phone.startsWith("91") && phone.length() == 12) {
                    phone = phone.substring(2);
                } else if (phone.length() == 10) {
                    // Keep as is
                } else if (phone.startsWith("+91")) {
                    phone = phone.substring(3);
                }
            }
            
            // Create WhatsApp intent with both image and text
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("image/*");
            intent.putExtra(Intent.EXTRA_STREAM, imageUri);
            intent.putExtra(Intent.EXTRA_TEXT, message);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            // Try to open WhatsApp
            try {
                getActivity().startActivity(intent);
            } catch (Exception e) {
                // Fallback: Open WhatsApp with text only using URL scheme
                if (phone != null && !phone.isEmpty()) {
                    String whatsappUrl = "https://wa.me/91" + phone + "?text=" + Uri.encode(message);
                    Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(whatsappUrl));
                    webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getActivity().startActivity(webIntent);
                } else {
                    // Fallback to chooser
                    intent.setPackage(null);
                    getActivity().startActivity(Intent.createChooser(intent, "Share via WhatsApp"));
                }
            }
            
            call.resolve();
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Error sharing image: " + e.getMessage());
        }
    }
}
