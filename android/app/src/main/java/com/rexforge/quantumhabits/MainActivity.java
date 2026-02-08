package com.rexforge.quantumhabits;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(ReminderPlugin.class);
        super.onCreate(savedInstanceState);

        // Request necessary permissions for reminders and notifications
        requestNotificationPermissions();

        // Initialize Firebase Cloud Messaging
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful()) {
                android.util.Log.w("MainActivity", "getInstanceId failed", task.getException());
                return;
            }
            String token = task.getResult();
            android.util.Log.d("MainActivity", "FCM Token: " + token);
            getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
                    .edit()
                    .putString("fcm_token", token)
                    .apply();
        });

        // Create notification channel for Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannels();
        }
    }

    private void requestNotificationPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ requires SCHEDULE_EXACT_ALARM permission
            if (checkSelfPermission(
                    android.Manifest.permission.SCHEDULE_EXACT_ALARM) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[] { android.Manifest.permission.SCHEDULE_EXACT_ALARM },
                        1001);
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ requires POST_NOTIFICATIONS permission
            if (checkSelfPermission(
                    android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[] { android.Manifest.permission.POST_NOTIFICATIONS },
                        1002);
            }
        }
    }

    private void createNotificationChannels() {
        NotificationManager notificationManager = getSystemService(NotificationManager.class);

        // Reminders channel
        NotificationChannel remindersChannel = new NotificationChannel(
                "habit_reminders",
                "Habit Reminders",
                NotificationManager.IMPORTANCE_HIGH);
        remindersChannel.setDescription("Notifications for your habit reminders");
        remindersChannel.enableVibration(true);
        remindersChannel.setShowBadge(true);
        notificationManager.createNotificationChannel(remindersChannel);

        // FCM channel
        NotificationChannel fcmChannel = new NotificationChannel(
                "fcm_default",
                "Push Notifications",
                NotificationManager.IMPORTANCE_HIGH);
        fcmChannel.setDescription("Push notifications from Firebase");
        fcmChannel.enableVibration(true);
        fcmChannel.setShowBadge(true);
        notificationManager.createNotificationChannel(fcmChannel);
    }
}
