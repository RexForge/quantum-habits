package com.rexforge.quantumhabits;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        android.util.Log.d("ReminderReceiver", "onReceive called - action: " + intent.getAction());
        
        // Acquire wake lock immediately to prevent MIUI from killing the process
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "QuantumHabits:reminder"
        );
        wakeLock.acquire(5000); // 5 second wake lock (minimal battery impact)
        
        try {
            if (intent == null || !intent.getAction().equals("com.rexforge.quantumhabits.REMINDER")) {
                android.util.Log.d("ReminderReceiver", "Ignoring intent with wrong action");
                return;
            }
            
            String habitName = intent.getStringExtra("habitName");
            String habitIcon = intent.getStringExtra("habitIcon");
            String message = intent.getStringExtra("message");
            int notificationId = intent.getIntExtra("notificationId", 0);

            android.util.Log.d("ReminderReceiver", "Posting notification: " + habitIcon + " " + habitName + " (id: " + notificationId + ")");

            // Create intent to open app
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                notificationId,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Create notification
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "habit_reminders")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(habitIcon + " " + habitName)
                .setContentText(message != null && !message.isEmpty() ? message : "Time for your " + habitName + " habit!")
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setContentIntent(pendingIntent)
                .setVibrate(new long[]{0, 500, 250, 500}); // Vibration pattern

            NotificationManager notificationManager = 
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            
            // Ensure notification channel exists for Android 8+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    "habit_reminders",
                    "Habit Reminders",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notifications for your habit reminders");
                channel.enableVibration(true);
                channel.setShowBadge(true);
                notificationManager.createNotificationChannel(channel);
            }
            
            notificationManager.notify(notificationId, builder.build());
            android.util.Log.d("ReminderReceiver", "Notification posted successfully");
        } finally {
            wakeLock.release();
        }
    }
}
