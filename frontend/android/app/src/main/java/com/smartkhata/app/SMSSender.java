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
            
            Log.d(TAG, "Attempting to send SMS to: " + phone);
            Log.d(TAG, "Message: " + message);
            
            if (phone == null || phone.isEmpty()) {
                Log.e(TAG, "Phone number is empty");
                call.reject("Phone number is required");
                return;
            }
            
            if (message == null || message.isEmpty()) {
                Log.e(TAG, "Message is empty");
                call.reject("Message is required");
                return;
            }
            
            // Check SMS permission
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.SEND_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "SMS permission not granted");
                call.reject("SMS permission not granted");
                return;
            }
            
            // Clean phone number - remove spaces, dashes, parentheses
            phone = phone.replaceAll("[\\s\\-()]", "");
            
            // Handle various phone number formats
            // If starts with 91 and is 12 digits, add + prefix
            if (phone.startsWith("91") && phone.length() == 12) {
                phone = "+" + phone;
            }
            // If is 10 digits, add +91 prefix
            else if (phone.length() == 10) {
                phone = "+91" + phone;
            }
            // If already has + prefix, keep as is
            else if (!phone.startsWith("+")) {
                // Default: add +91 if no country code
                phone = "+91" + phone;
            }
            
            Log.d(TAG, "Cleaned phone number: " + phone);
            
            // Send SMS
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phone, null, message, null, null);
            
            Log.d(TAG, "SMS sent successfully to: " + phone);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "SMS sent successfully");
            result.put("phone", phone);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending SMS: " + e.getMessage());
            e.printStackTrace();
            call.reject("Error sending SMS: " + e.getMessage());
        }
    }
}
