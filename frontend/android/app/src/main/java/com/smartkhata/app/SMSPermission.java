package com.smartkhata.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SMSPermission")
public class SMSPermission extends Plugin {

    private static final int SMS_PERMISSION_CODE = 1001;

    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.SEND_SMS) 
                == PackageManager.PERMISSION_GRANTED) {
                JSObject result = new JSObject();
                result.put("granted", true);
                call.resolve(result);
                return;
            }
            
            // For Android 13+, SMS is a sensitive permission
            // Guide user to settings
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                JSObject result = new JSObject();
                result.put("granted", false);
                result.put("needsSettings", true);
                result.put("message", "SMS permission is sensitive. Please grant it in app settings.");
                call.resolve(result);
                return;
            }
            
            // Request permission for older Android versions
            getActivity().requestPermissions(
                new String[]{Manifest.permission.SEND_SMS},
                SMS_PERMISSION_CODE
            );
            
            JSObject result = new JSObject();
            result.put("granted", false);
            result.put("message", "Permission requested. Please check the permission dialog.");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error requesting permission: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
            intent.setData(uri);
            getActivity().startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error opening settings: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void checkPermission(PluginCall call) {
        try {
            boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.SEND_SMS) 
                == PackageManager.PERMISSION_GRANTED;
            
            JSObject result = new JSObject();
            result.put("granted", granted);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error checking permission: " + e.getMessage());
        }
    }
}
