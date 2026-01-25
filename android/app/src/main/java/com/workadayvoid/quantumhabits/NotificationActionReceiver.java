package com.workadayvoid.quantumhabits;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

public class NotificationActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        int habitId = intent.getIntExtra("habitId", -1);
        String reminderId = intent.getStringExtra("reminderId");

        if (habitId == -1)
            return;

        if ("COMPLETE_HABIT".equals(action)) {
            // Mark habit as complete for today
            markHabitComplete(context, habitId);

            // Cancel the notification
            NotificationManagerCompat.from(context).cancel(HabitReminderService.NOTIFICATION_ID_BASE + habitId);

            // Show feedback (startActivity is blocked on Android 12+ from here)
            android.widget.Toast.makeText(context, "Habit marked as complete", android.widget.Toast.LENGTH_SHORT)
                    .show();

        } else if ("SNOOZE_HABIT".equals(action)) {
            // Snooze the reminder for 1 hour
            snoozeReminder(context, habitId, reminderId);

            // Cancel the current notification
            NotificationManagerCompat.from(context).cancel(HabitReminderService.NOTIFICATION_ID_BASE + habitId);

            // Show snooze confirmation
            showSnoozeConfirmation(context, habitId);
        }
    }

    private void markHabitComplete(Context context, int habitId) {
        // Load habits from shared preferences
        SharedPreferences prefs = context.getSharedPreferences("quantumhabits_data", Context.MODE_PRIVATE);
        String habitsJson = prefs.getString("habits", "[]");

        try {
            JSONArray habitsArray = new JSONArray(habitsJson);

            for (int i = 0; i < habitsArray.length(); i++) {
                JSONObject habit = habitsArray.getJSONObject(i);
                if (habit.getInt("id") == habitId) {
                    // Mark today's completion
                    String todayKey = new java.text.SimpleDateFormat("yyyy-MM-dd",
                            java.util.Locale.getDefault()).format(new java.util.Date());

                    JSONObject completions = habit.optJSONObject("completions");
                    if (completions == null) {
                        completions = new JSONObject();
                    }

                    completions.put(todayKey, 1);
                    habit.put("completions", completions);

                    // Save back to preferences
                    prefs.edit().putString("habits", habitsArray.toString()).apply();
                    break;
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void snoozeReminder(Context context, int habitId, String reminderId) {
        // Load habits to get habit details
        SharedPreferences prefs = context.getSharedPreferences("quantumhabits_data", Context.MODE_PRIVATE);
        String habitsJson = prefs.getString("habits", "[]");

        try {
            JSONArray habitsArray = new JSONArray(habitsJson);

            for (int i = 0; i < habitsArray.length(); i++) {
                JSONObject habit = habitsArray.getJSONObject(i);
                if (habit.getInt("id") == habitId) {
                    String habitName = habit.getString("name");
                    String habitColor = habit.optString("color", "#3b82f6");

                    JSONArray reminders = habit.optJSONArray("reminders");
                    if (reminders != null && reminders.length() > 0) {
                        JSONObject reminder = reminders.getJSONObject(0); // Use first reminder
                        String message = reminder.optString("message", "Time for your habit!");

                        // Schedule new reminder for 1 hour from now
                        long snoozeTime = System.currentTimeMillis() + (60 * 60 * 1000); // 1 hour
                        String newReminderId = reminderId + "_snooze";

                        HabitReminderService.scheduleReminder(
                                context,
                                newReminderId,
                                habitName,
                                message + " (Snoozed)",
                                habitColor,
                                snoozeTime,
                                habitId,
                                0);
                    }
                    break;
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void showSnoozeConfirmation(Context context, int habitId) {
        // This could show a brief confirmation, but for now we'll just rely on the
        // service
        // In a full implementation, you might want to show a toast or small
        // notification
        android.widget.Toast.makeText(context,
                "Reminder snoozed for 1 hour", android.widget.Toast.LENGTH_SHORT).show();
    }
}
