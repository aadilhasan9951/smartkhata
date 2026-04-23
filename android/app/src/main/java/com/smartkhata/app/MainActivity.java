package com.smartkhata.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Timer;
import java.util.TimerTask;

public class MainActivity extends AppCompatActivity {
    private static final int CONTACTS_PERMISSION_REQUEST_CODE = 100;
    private static final int NOTIFICATION_PERMISSION_REQUEST_CODE = 101;
    private static final int ALARM_PERMISSION_REQUEST_CODE = 102;
    private WebView webView;
    private static final String WEB_APP_URL = "http://10.0.2.2:3000"; // For emulator
    // For real device, use your actual IP: http://YOUR_IP:3000

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        
        // Setup WebView
        setupWebView();

        // Create notification channel
        ReminderService.createNotificationChannel(this);

        // Check for reminder intent
        handleReminderIntent();

        // Request permissions
        requestPermissions();
    }

    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // Enable mixed content for development
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        // Add JavaScript interface
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidInterface");

        // Load web app
        webView.loadUrl(WEB_APP_URL);
    }

    private void handleReminderIntent() {
        Intent intent = getIntent();
        if (intent != null && intent.getBooleanExtra("sendWhatsApp", false)) {
            String customerPhone = intent.getStringExtra("customerPhone");
            String customerName = intent.getStringExtra("customerName");
            String balance = intent.getStringExtra("balance");

            // Send WhatsApp message
            String message = "Hello " + customerName + ", your outstanding balance is ₹" + balance + ". Please pay when possible.";
            String whatsappUrl = "https://wa.me/" + customerPhone + "?text=" + Uri.encode(message);
            
            Intent whatsappIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(whatsappUrl));
            startActivity(whatsappIntent);
        }
    }

    private void requestPermissions() {
        // Request contacts permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.READ_CONTACTS},
                    CONTACTS_PERMISSION_REQUEST_CODE);
        }

        // Request notification permission (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        NOTIFICATION_PERMISSION_REQUEST_CODE);
            }
        }

        // Request exact alarm permission (Android 12+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (!alarmManager.canScheduleExactAlarms()) {
                Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                startActivity(intent);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == CONTACTS_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission granted, sync contacts
                syncContacts();
            } else {
                Toast.makeText(this, "Contacts permission denied", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void syncContacts() {
        new Thread(() -> {
            try {
                JSONArray contactsArray = new JSONArray();
                
                Cursor cursor = getContentResolver().query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    new String[]{
                        ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                        ContactsContract.CommonDataKinds.Phone.NUMBER
                    },
                    null,
                    null,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
                );

                if (cursor != null) {
                    while (cursor.moveToNext()) {
                        String name = cursor.getString(0);
                        String phone = cursor.getString(1);
                        
                        if (name != null && phone != null) {
                            JSONObject contact = new JSONObject();
                            contact.put("name", name);
                            contact.put("phone", phone);
                            contactsArray.put(contact);
                        }
                    }
                    cursor.close();
                }

                // Send contacts to web app via JavaScript
                final String contactsJson = contactsArray.toString();
                runOnUiThread(() -> {
                    webView.evaluateJavascript(
                        "window.receiveContacts(" + contactsJson + ")",
                        value -> {
                            Toast.makeText(MainActivity.this, 
                                "Synced " + contactsArray.length() + " contacts", 
                                Toast.LENGTH_SHORT).show();
                        }
                    );
                });

            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "Error syncing contacts", Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    private void requestContactsPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) 
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.READ_CONTACTS},
                CONTACTS_PERMISSION_REQUEST_CODE
            );
        } else {
            syncContacts();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
