package com.smartkhata.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.ExistingPeriodicWorkPolicy;
import com.getcapacitor.BridgeActivity;
import com.smartkhata.app.WhatsAppShare;
import com.smartkhata.app.SMSPermission;
import java.util.concurrent.TimeUnit;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom plugins
        this.registerPlugin(WhatsAppShare.class);
        this.registerPlugin(SMSPermission.class);
        
        // Schedule daily reminder worker
        scheduleReminderWorker();
        
        // Enable file access for WebView
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setJavaScriptEnabled(true);
        }
    }
    
    private void scheduleReminderWorker() {
        PeriodicWorkRequest workRequest = new PeriodicWorkRequest.Builder(
            ReminderWorker.class,
            1,
            TimeUnit.DAYS
        ).build();
        
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "reminder_work",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        );
    }
}
