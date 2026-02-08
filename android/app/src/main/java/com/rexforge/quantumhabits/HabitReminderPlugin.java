
package com.rexforge.quantumhabits;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "HabitReminder")
public class HabitReminderPlugin extends Plugin {

    @PluginMethod
    public void scheduleHabitReminders(PluginCall call) {
        try {
            String habitsJson = call.getString("habits", "[]");
            JSONArray habits = new JSONArray(habitsJson);
            long now = System.currentTimeMillis();

            for (int i = 0; i < habits.length(); i++) {
                JSONObject habit = habits.getJSONObject(i);
                int habitId = habit.getInt("id");
                String habitName = habit.getString("name");
                String habitColor = habit.optString("color", "#3b82f6");

                JSONArray reminders = habit.optJSONArray("reminders");
                if (reminders != null) {
                    for (int j = 0; j < reminders.length(); j++) {
                        JSONObject reminder = reminders.getJSONObject(j);
                        if (!reminder.optBoolean("enabled", false)) continue;

                        String message = reminder.optString("message", "Time for your habit!");
                        String type = reminder.optString("type", "specific");

                        if ("specific".equals(type)) {
                            JSONArray times = reminder.optJSONArray("times");
                            if (times != null) {
                                for (int k = 0; k < times.length(); k++) {
                                    String timeStr = times.getString(k);
                                    long reminderTime = calculateNextReminderTime(timeStr);

                                    if (reminderTime > now) {
                                        String reminderId = "habit-" + habitId + "-reminder-" + j + "-time-" + k;
                                        HabitReminderService.scheduleReminder(
                                            getContext(), reminderId, habitName, message, habitColor,
                                            reminderTime, habitId, j
                                        );
                                    }
                                }
                            }
                        } else if ("interval".equals(type)) {
                            String startTime = reminder.optString("startTime", "09:00");
                            String endTime = reminder.optString("endTime", "18:00");
                            int interval = reminder.optInt("interval", 120);

                            long[] intervalTimes = calculateIntervalReminderTimes(startTime, endTime, interval);
                            for (int k = 0; k < intervalTimes.length; k++) {
                                if (intervalTimes[k] > now) {
                                    String reminderId = "habit-" + habitId + "-reminder-" + j + "-interval-" + k;
                                    HabitReminderService.scheduleReminder(
                                        getContext(), reminderId, habitName, message, habitColor,
                                        intervalTimes[k], habitId, j
                                    );
                                }
                            }
                        }
                    }
                }
            }
            call.resolve();
        } catch (JSONException e) {
            call.reject("Error parsing habits JSON", e);
        }
    }

    @PluginMethod
    public void cancelHabitReminders(PluginCall call) {
        Integer habitId = call.getInt("habitId");
        if (habitId == null) {
            call.reject("habitId is required");
            return;
        }
        HabitReminderService.cancelReminders(getContext(), habitId);
        call.resolve();
    }
    
    private long calculateNextReminderTime(String timeStr) {
        try {
            String[] parts = timeStr.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);

            java.util.Calendar calendar = java.util.Calendar.getInstance();
            calendar.set(java.util.Calendar.HOUR_OF_DAY, hours);
            calendar.set(java.util.Calendar.MINUTE, minutes);
            calendar.set(java.util.Calendar.SECOND, 0);
            calendar.set(java.util.Calendar.MILLISECOND, 0);

            long reminderTime = calendar.getTimeInMillis();

            // If the time has already passed today, schedule for tomorrow
            if (reminderTime <= System.currentTimeMillis()) {
                reminderTime += 24 * 60 * 60 * 1000; // Add one day
            }

            return reminderTime;
        } catch (Exception e) {
            return System.currentTimeMillis() + 60 * 60 * 1000; // Default to 1 hour from now
        }
    }

    private long[] calculateIntervalReminderTimes(String startTime, String endTime, int intervalMinutes) {
        try {
            String[] startParts = startTime.split(":");
            String[] endParts = endTime.split(":");

            int startHours = Integer.parseInt(startParts[0]);
            int startMinutes = Integer.parseInt(startParts[1]);
            int endHours = Integer.parseInt(endParts[0]);
            int endMinutes = Integer.parseInt(endParts[1]);

            int startTotalMinutes = startHours * 60 + startMinutes;
            int endTotalMinutes = endHours * 60 + endMinutes;

            java.util.List<Long> times = new java.util.ArrayList<>();

            for (int minutes = startTotalMinutes; minutes <= endTotalMinutes; minutes += intervalMinutes) {
                int hours = minutes / 60;
                int mins = minutes % 60;

                java.util.Calendar calendar = java.util.Calendar.getInstance();
                calendar.set(java.util.Calendar.HOUR_OF_DAY, hours);
                calendar.set(java.util.Calendar.MINUTE, mins);
                calendar.set(java.util.Calendar.SECOND, 0);
                calendar.set(java.util.Calendar.MILLISECOND, 0);

                long reminderTime = calendar.getTimeInMillis();

                // If the time has already passed today, skip it
                if (reminderTime > System.currentTimeMillis()) {
                    times.add(reminderTime);
                }
            }

            // Convert to array
            long[] result = new long[times.size()];
            for (int i = 0; i < times.size(); i++) {
                result[i] = times.get(i);
            }

            return result;
        } catch (Exception e) {
            return new long[]{System.currentTimeMillis() + 60 * 60 * 1000}; // Default to 1 hour from now
        }
    }
}
