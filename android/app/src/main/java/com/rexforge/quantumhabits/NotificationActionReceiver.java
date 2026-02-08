package com.rexforge.quantumhabits;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class NotificationActionReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        int habitId = intent.getIntExtra("habitId", -1);

        if ("COMPLETE_HABIT".equals(action)) {
            // Handle habit completion logic
            updateHabitCompletion(context, habitId);
            // You might want to send an event back to your web app
        } else if ("SNOOZE_HABIT".equals(action)) {
            // Handle snooze logic
            snoozeReminder(context, habitId);
        }
    }

    private void updateHabitCompletion(Context context, int habitId) {
        // This is where you would update your data storage
        // For now, we will just show a toast as an example
        android.widget.Toast.makeText(context, "Habit " + habitId + " marked as complete!", android.widget.Toast.LENGTH_SHORT).show();

        // As an example, let's assume we update a value in SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences("habit_data", Context.MODE_PRIVATE);
        String habitsJson = prefs.getString("habits", "[]");

        try {
            JSONArray habits = new JSONArray(habitsJson);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject habit = habits.getJSONObject(i);
                if (habit.getInt("id") == habitId) {
                    // Update some value, e.g., a completion count
                    int completions = habit.optInt("completions", 0);
                    habit.put("completions", completions + 1);
                    break;
                }
            }
            prefs.edit().putString("habits", habits.toString()).apply();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void snoozeReminder(Context context, int habitId) {
        // Snooze for 10 minutes (as an example)
        long snoozeTime = System.currentTimeMillis() + 10 * 60 * 1000;

        // Here you should re-schedule the reminder using your service
        // This requires finding the original reminder details
        // For simplicity, we just show a toast
        android.widget.Toast.makeText(context, "Snoozing habit " + habitId, android.widget.Toast.LENGTH_SHORT).show();

        // You would need a more robust way to find and re-schedule the exact reminder
        // For example:
        // HabitReminderService.scheduleReminder(context, ...);
    }
}
