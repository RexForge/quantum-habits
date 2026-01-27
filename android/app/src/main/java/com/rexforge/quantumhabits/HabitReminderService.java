package com.rexforge.quantumhabits;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.ArrayList;
import java.util.List;
import java.util.Iterator;

public class HabitReminderService extends Service {
    private static final String CHANNEL_ID = "habit_reminders";
    public static final int NOTIFICATION_ID_BASE = 1000;
    private Handler handler;
    private Runnable reminderChecker;
    private List<ScheduledReminder> scheduledReminders;

    private static class ScheduledReminder {
        String id;
        String habitName;
        String message;
        String habitColor;
        long timestamp;
        int habitId;
        int reminderIndex;

        ScheduledReminder(String id, String habitName, String message, String habitColor,
                long timestamp, int habitId, int reminderIndex) {
            this.id = id;
            this.habitName = habitName;
            this.message = message;
            this.habitColor = habitColor;
            this.timestamp = timestamp;
            this.habitId = habitId;
            this.reminderIndex = reminderIndex;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        scheduledReminders = new ArrayList<>();
        handler = new Handler(Looper.getMainLooper());

        // Check for reminders every minute
        reminderChecker = new Runnable() {
            @Override
            public void run() {
                checkAndShowReminders();
                handler.postDelayed(this, 60000); // Check every minute
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Load existing reminders first to ensure we have the latest state
        loadScheduledReminders();

        if (intent != null) {
            String action = intent.getAction();
            if ("SCHEDULE_REMINDER".equals(action)) {
                handleScheduleReminder(intent);
            } else if ("CANCEL_REMINDERS".equals(action)) {
                handleCancelReminders(intent);
            }
        }

        // Start the reminder checker if not already running
        handler.removeCallbacks(reminderChecker);
        handler.post(reminderChecker);

        // Make this service run in foreground to prevent it from being killed
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+
            startForeground(NOTIFICATION_ID_BASE - 1, createForegroundNotification(),
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID_BASE - 1, createForegroundNotification());
        }

        return START_STICKY;
    }

    private void handleScheduleReminder(Intent intent) {
        String id = intent.getStringExtra("id");
        String habitName = intent.getStringExtra("habitName");
        String message = intent.getStringExtra("message");
        String habitColor = intent.getStringExtra("habitColor");
        long timestamp = intent.getLongExtra("timestamp", 0);
        int habitId = intent.getIntExtra("habitId", -1);
        int reminderIndex = intent.getIntExtra("reminderIndex", -1);

        if (id != null && habitId != -1) {
            // Remove existing reminder with same ID if exists
            Iterator<ScheduledReminder> iterator = scheduledReminders.iterator();
            while (iterator.hasNext()) {
                if (iterator.next().id.equals(id)) {
                    iterator.remove();
                }
            }

            ScheduledReminder reminder = new ScheduledReminder(
                    id, habitName, message, habitColor, timestamp, habitId, reminderIndex);
            scheduledReminders.add(reminder);
            saveScheduledReminders();
        }
    }

    private void handleCancelReminders(Intent intent) {
        int habitId = intent.getIntExtra("habitId", -1);
        if (habitId != -1) {
            boolean changed = false;
            Iterator<ScheduledReminder> iterator = scheduledReminders.iterator();
            while (iterator.hasNext()) {
                if (iterator.next().habitId == habitId) {
                    iterator.remove();
                    changed = true;
                }
            }

            if (changed) {
                saveScheduledReminders();
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null) {
            handler.removeCallbacks(reminderChecker);
        }
        saveScheduledReminders();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Habit Reminders";
            String description = "Notifications for habit reminders";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.enableLights(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private android.app.Notification createForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("QuantumHabits Active")
                .setContentText("Habit reminders are running in background")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void loadScheduledReminders() {
        SharedPreferences prefs = getSharedPreferences("habit_reminders", MODE_PRIVATE);
        String remindersJson = prefs.getString("scheduled_reminders", "[]");

        try {
            JSONArray remindersArray = new JSONArray(remindersJson);
            scheduledReminders.clear();

            for (int i = 0; i < remindersArray.length(); i++) {
                JSONObject reminderObj = remindersArray.getJSONObject(i);
                ScheduledReminder reminder = new ScheduledReminder(
                        reminderObj.getString("id"),
                        reminderObj.getString("habitName"),
                        reminderObj.getString("message"),
                        reminderObj.getString("habitColor"),
                        reminderObj.getLong("timestamp"),
                        reminderObj.getInt("habitId"),
                        reminderObj.getInt("reminderIndex"));
                scheduledReminders.add(reminder);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void saveScheduledReminders() {
        JSONArray remindersArray = new JSONArray();

        for (ScheduledReminder reminder : scheduledReminders) {
            try {
                JSONObject reminderObj = new JSONObject();
                reminderObj.put("id", reminder.id);
                reminderObj.put("habitName", reminder.habitName);
                reminderObj.put("message", reminder.message);
                reminderObj.put("habitColor", reminder.habitColor);
                reminderObj.put("timestamp", reminder.timestamp);
                reminderObj.put("habitId", reminder.habitId);
                reminderObj.put("reminderIndex", reminder.reminderIndex);
                remindersArray.put(reminderObj);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        SharedPreferences prefs = getSharedPreferences("habit_reminders", MODE_PRIVATE);
        prefs.edit().putString("scheduled_reminders", remindersArray.toString()).apply();
    }

    private void checkAndShowReminders() {
        long currentTime = System.currentTimeMillis();
        boolean changed = false;

        Iterator<ScheduledReminder> iterator = scheduledReminders.iterator();
        while (iterator.hasNext()) {
            ScheduledReminder reminder = iterator.next();
            if (currentTime >= reminder.timestamp) {
                // If it's within the last 5 minutes, show it. If older, just discard it
                // (missed)
                if (currentTime < reminder.timestamp + 5 * 60000) {
                    showReminderNotification(reminder);
                }
                iterator.remove(); // Remove after showing or if stale
                changed = true;
            }
        }

        if (changed) {
            saveScheduledReminders();
        }
    }

    private void showReminderNotification(ScheduledReminder reminder) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("habitId", reminder.habitId);
        intent.putExtra("reminderIndex", reminder.reminderIndex);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, reminder.habitId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Complete action
        Intent completeIntent = new Intent(this, NotificationActionReceiver.class);
        completeIntent.setAction("COMPLETE_HABIT");
        completeIntent.putExtra("habitId", reminder.habitId);
        completeIntent.putExtra("reminderId", reminder.id);
        PendingIntent completePendingIntent = PendingIntent.getBroadcast(
                this, reminder.habitId * 100, completeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Snooze action
        Intent snoozeIntent = new Intent(this, NotificationActionReceiver.class);
        snoozeIntent.setAction("SNOOZE_HABIT");
        snoozeIntent.putExtra("habitId", reminder.habitId);
        snoozeIntent.putExtra("reminderId", reminder.id);
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
                this, reminder.habitId * 100 + 1, snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("🔔 " + reminder.habitName)
                .setContentText(reminder.message)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(reminder.message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setVibrate(new long[] { 0, 250, 250, 250 })
                .setLights(0xFF0000FF, 1000, 1000)
                .addAction(android.R.drawable.ic_menu_save, "Mark Complete", completePendingIntent)
                .addAction(android.R.drawable.ic_menu_recent_history, "Remind Later", snoozePendingIntent);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(
                    android.Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                notificationManager.notify(NOTIFICATION_ID_BASE + reminder.habitId, builder.build());
            }
        } else {
            notificationManager.notify(NOTIFICATION_ID_BASE + reminder.habitId, builder.build());
        }
    }

    public static void scheduleReminder(android.content.Context context, String id, String habitName,
            String message, String habitColor, long timestamp,
            int habitId, int reminderIndex) {
        Intent serviceIntent = new Intent(context, HabitReminderService.class);
        serviceIntent.setAction("SCHEDULE_REMINDER");
        serviceIntent.putExtra("id", id);
        serviceIntent.putExtra("habitName", habitName);
        serviceIntent.putExtra("message", message);
        serviceIntent.putExtra("habitColor", habitColor);
        serviceIntent.putExtra("timestamp", timestamp);
        serviceIntent.putExtra("habitId", habitId);
        serviceIntent.putExtra("reminderIndex", reminderIndex);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    public static void cancelReminders(android.content.Context context, int habitId) {
        Intent serviceIntent = new Intent(context, HabitReminderService.class);
        serviceIntent.setAction("CANCEL_REMINDERS");
        serviceIntent.putExtra("habitId", habitId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Intent restartServiceIntent = new Intent(getApplicationContext(), this.getClass());
        restartServiceIntent.setPackage(getPackageName());
        startService(restartServiceIntent);
        super.onTaskRemoved(rootIntent);
    }
}
