package com.smartkhata.app;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SMSPermission")
public class SMSPermission extends Plugin {

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
            
            // Request permission
            getActivity().requestPermissions(
                new String[]{Manifest.permission.SEND_SMS},
                1001
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
