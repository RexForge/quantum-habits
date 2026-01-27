
package com.rexforge.quantumhabits;

import android.graphics.Color;
import android.view.Window;
import android.view.WindowManager;


import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HabitReminderPlugin.class);
        super.onCreate(savedInstanceState);

        // 🔥 EDGE TO EDGE UI (Premium look)
        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        window.setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );
    
        // Start the background reminder service
        startReminderService();

        // Handle notification actions
        handleNotificationIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleNotificationIntent(intent);
    }

    private void startReminderService() {
        Intent serviceIntent = new Intent(this, HabitReminderService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    private void handleNotificationIntent(Intent intent) {
        if (intent == null)
            return;

        String action = intent.getStringExtra("action");
        int habitId = intent.getIntExtra("habitId", -1);

        if ("complete".equals(action) && habitId != -1) {
            // Handle habit completion from notification
            // This will be handled by the Capacitor web app
            // You could also implement native handling here if needed
            // Ideally fire an event to JS
        }
    }
}
