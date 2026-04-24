package com.smartkhata.app;

import android.content.Context;
import android.telephony.SmsManager;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

public class ReminderWorker extends Worker {

    private static final String TAG = "ReminderWorker";
    private static final String API_URL = "https://smartkhata-8jaj.onrender.com/api";

    public ReminderWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(TAG, "ReminderWorker started");
        
        try {
            // Fetch pending reminders from backend
            JSONArray reminders = fetchPendingReminders();
            
            if (reminders != null && reminders.length() > 0) {
                Log.d(TAG, "Found " + reminders.length() + " pending reminders");
                
                long today = System.currentTimeMillis();
                
                for (int i = 0; i < reminders.length(); i++) {
                    try {
                        JSONObject reminder = reminders.getJSONObject(i);
                        String customerPhone = reminder.getString("phone");
                        String customerName = reminder.getString("customer_name");
                        double amount = reminder.getDouble("balance");
                        String shopName = reminder.optString("shop_name", "Shop");
                        String lastReminded = reminder.optString("last_reminded_at");
                        
                        // Check if reminder was already sent today
                        if (!isSameDay(lastReminded, today)) {
                            // Send SMS
                            String message = String.format(
                                "Dear %s, your pending amount is ₹%.2f. Please clear your dues. – %s",
                                customerName,
                                amount,
                                shopName
                            );
                            
                            sendSMS(customerPhone, message);
                            Log.d(TAG, "SMS sent to " + customerPhone);
                            
                            // Update last reminded timestamp
                            updateReminderSent(reminder.getString("customer_id"));
                        } else {
                            Log.d(TAG, "Reminder already sent today for " + customerName);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error processing reminder: " + e.getMessage());
                    }
                }
            } else {
                Log.d(TAG, "No pending reminders found");
            }
            
            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Error in ReminderWorker: " + e.getMessage());
            return Result.failure();
        }
    }
    
    private JSONArray fetchPendingReminders() {
        try {
            URL url = new URL(API_URL + "/reminders/pending");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");
            
            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String inputLine;
                StringBuilder response = new StringBuilder();
                
                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();
                
                JSONObject jsonResponse = new JSONObject(response.toString());
                if (jsonResponse.has("data")) {
                    return jsonResponse.getJSONArray("data");
                }
            }
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Error fetching reminders: " + e.getMessage());
        }
        return null;
    }
    
    private void sendSMS(String phone, String message) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phone, null, message, null, null);
            Log.d(TAG, "SMS sent successfully to " + phone);
        } catch (Exception e) {
            Log.e(TAG, "Error sending SMS: " + e.getMessage());
        }
    }
    
    private void updateReminderSent(String customerId) {
        try {
            URL url = new URL(API_URL + "/reminders/" + customerId + "/sent");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Reminder update response: " + responseCode);
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Error updating reminder: " + e.getMessage());
        }
    }
    
    private boolean isSameDay(String lastRemindedStr, long today) {
        if (lastRemindedStr == null || lastRemindedStr.isEmpty()) {
            return false;
        }
        
        try {
            long lastReminded = Long.parseLong(lastRemindedStr);
            Calendar c1 = Calendar.getInstance();
            Calendar c2 = Calendar.getInstance();
            
            c1.setTimeInMillis(lastReminded);
            c2.setTimeInMillis(today);
            
            return c1.get(Calendar.YEAR) == c2.get(Calendar.YEAR) &&
                   c1.get(Calendar.DAY_OF_YEAR) == c2.get(Calendar.DAY_OF_YEAR);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing last reminded date: " + e.getMessage());
            return false;
        }
    }
}
