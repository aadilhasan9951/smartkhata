package com.smartkhata.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;
import java.util.Date;

public class ReminderService {
    private static final String CHANNEL_ID = "reminder_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static void scheduleReminder(Context context, String customerName, String customerPhone, String balance, String time, String frequency) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARMManager);
        Intent intent = new Intent(context, ReminderReceiver.class);
        intent.putExtra("customerName", customerName);
        intent.putExtra("customerPhone", customerPhone);
        intent.putExtra("balance", balance);
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            customerPhone.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Calculate trigger time
        long triggerTime = calculateTriggerTime(time, frequency);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
        }
    }

    private static long calculateTriggerTime(String time, String frequency) {
        String[] timeParts = time.split(":");
        int hour = Integer.parseInt(timeParts[0]);
        int minute = Integer.parseInt(timeParts[1]);

        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);

        // If time has passed today, schedule for tomorrow or next occurrence
        if (calendar.getTimeInMillis() < System.currentTimeMillis()) {
            switch (frequency) {
                case "daily":
                    calendar.add(Calendar.DAY_OF_MONTH, 1);
                    break;
                case "weekly":
                    calendar.add(Calendar.WEEK_OF_YEAR, 1);
                    break;
                case "biweekly":
                    calendar.add(Calendar.DAY_OF_MONTH, 14);
                    break;
                case "monthly":
                    calendar.add(Calendar.MONTH, 1);
                    break;
                default:
                    calendar.add(Calendar.DAY_OF_MONTH, 1);
            }
        }

        return calendar.getTimeInMillis();
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Payment Reminders",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for payment reminders");
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    public static void showNotification(Context context, String customerName, String customerPhone, String balance) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // Create intent for sending WhatsApp
        Intent whatsappIntent = new Intent(context, MainActivity.class);
        whatsappIntent.putExtra("sendWhatsApp", true);
        whatsappIntent.putExtra("customerPhone", customerPhone);
        whatsappIntent.putExtra("customerName", customerName);
        whatsappIntent.putExtra("balance", balance);
        whatsappIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            whatsappIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle("Payment Reminder")
                .setContentText("Send reminder to " + customerName)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build();

        notificationManager.notify(NOTIFICATION_ID, notification);
    }

    public static class ReminderReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String customerName = intent.getStringExtra("customerName");
            String customerPhone = intent.getStringExtra("customerPhone");
            String balance = intent.getStringExtra("balance");

            showNotification(context, customerName, customerPhone, balance);
        }
    }
}
