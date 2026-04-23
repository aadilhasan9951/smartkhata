package com.smartkhata.app;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import org.json.JSONArray;
import org.json.JSONObject;

public class WebAppInterface {
    private Context context;
    private AppCompatActivity activity;

    public WebAppInterface(Context context, AppCompatActivity activity) {
        this.context = context;
        this.activity = activity;
    }

    @JavascriptInterface
    public void syncContacts() {
        ((MainActivity) activity).requestContactsPermission();
    }

    @JavascriptInterface
    public void sendWhatsAppMessage(String phone, String message) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse("https://wa.me/" + phone + "?text=" + Uri.encode(message)));
            context.startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(context, "WhatsApp not installed", Toast.LENGTH_SHORT).show();
        }
    }

    @JavascriptInterface
    public void scheduleReminder(String customerName, String customerPhone, String balance, String time, String frequency) {
        ReminderService.scheduleReminder(context, customerName, customerPhone, balance, time, frequency);
        Toast.makeText(context, "Reminder scheduled for " + customerName, Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void cancelReminder(String customerPhone) {
        android.app.AlarmManager alarmManager = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, ReminderService.ReminderReceiver.class);
        android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
            context,
            customerPhone.hashCode(),
            intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.cancel(pendingIntent);
        Toast.makeText(context, "Reminder cancelled", Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public boolean isAndroidApp() {
        return true;
    }
}
