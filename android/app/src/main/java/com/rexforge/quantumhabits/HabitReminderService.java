package com.rexforge.quantumhabits;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
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
        // Load scheduled reminders from storage
        loadScheduledReminders();

        // Start the reminder checker
        handler.post(reminderChecker);

        // Make this service run in foreground to prevent it from being killed
        startForeground(NOTIFICATION_ID_BASE - 1, createForegroundNotification());

        return START_STICKY;
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
            notificationManager.createNotificationChannel(channel);
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
                    reminderObj.getInt("reminderIndex")
                );
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

        for (ScheduledReminder reminder : new ArrayList<>(scheduledReminders)) {
            if (currentTime >= reminder.timestamp && currentTime < reminder.timestamp + 60000) { // Within 1 minute window
                showReminderNotification(reminder);
                scheduledReminders.remove(reminder); // Remove after showing
            }
        }

        // Save updated reminders
        saveScheduledReminders();
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
            this, reminder.habitId * 100, completeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Snooze action
        Intent snoozeIntent = new Intent(this, NotificationActionReceiver.class);
        snoozeIntent.setAction("SNOOZE_HABIT");
        snoozeIntent.putExtra("habitId", reminder.habitId);
        snoozeIntent.putExtra("reminderId", reminder.id);
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
            this, reminder.habitId * 100 + 1, snoozeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("🔔 " + reminder.habitName)
            .setContentText(reminder.message)
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText(reminder.message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(new long[]{0, 250, 250, 250})
            .setLights(0xFF0000FF, 1000, 1000)
            .addAction(android.R.drawable.ic_menu_save, "Mark Complete", completePendingIntent)
            .addAction(android.R.drawable.ic_menu_recent_history, "Remind Later", snoozePendingIntent);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        notificationManager.notify(NOTIFICATION_ID_BASE + reminder.habitId, builder.build());
    }

    // Method to add a new reminder (called from MainActivity)
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

    // Method to cancel reminders for a habit
    public static void cancelReminders(android.content.Context context, int habitId) {
        Intent serviceIntent = new Intent(context, HabitReminderService.class);
        serviceIntent.setAction("CANCEL_REMINDERS");
        serviceIntent.putExtra("habitId", habitId);
        context.startService(serviceIntent);
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // App was swiped away, restart the service
        Intent restartServiceIntent = new Intent(getApplicationContext(), this.getClass());
        restartServiceIntent.setPackage(getPackageName());
        startService(restartServiceIntent);
        super.onTaskRemoved(rootIntent);
    }
}
