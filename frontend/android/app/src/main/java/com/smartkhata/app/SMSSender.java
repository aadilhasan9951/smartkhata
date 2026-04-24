package com.smartkhata.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.telephony.SmsManager;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SMSSender")
public class SMSSender extends Plugin {

    private static final String TAG = "SMSSender";

    @PluginMethod
    public void sendSMS(PluginCall call) {
        try {
            String phone = call.getString("phone");
            String message = call.getString("message");
            
            if (phone == null || phone.isEmpty()) {
                call.reject("Phone number is required");
                return;
            }
            
            if (message == null || message.isEmpty()) {
                call.reject("Message is required");
                return;
            }
            
            // Check SMS permission
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.SEND_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                call.reject("SMS permission not granted");
                return;
            }
            
            // Send SMS
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phone, null, message, null, null);
            
            Log.d(TAG, "SMS sent to " + phone);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "SMS sent successfully");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending SMS: " + e.getMessage());
            call.reject("Error sending SMS: " + e.getMessage());
        }
    }
}
