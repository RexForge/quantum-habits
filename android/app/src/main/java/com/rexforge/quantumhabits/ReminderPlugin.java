package com.rexforge.quantumhabits;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ReminderPlugin")
public class ReminderPlugin extends Plugin {

    @PluginMethod
    public void scheduleReminder(PluginCall call) {
        String habitIcon = call.getString("habitIcon", "");
        String habitName = call.getString("habitName", "");
        String message = call.getString("message", "");
        long timeInMillis = call.getLong("timeInMillis", 0L);
        int notificationId = call.getInt("notificationId", 0);

        if (timeInMillis == 0 || notificationId == 0) {
            call.reject("Missing required parameters");
            return;
        }

        try {
            // Check and request permission if needed
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (getActivity().checkSelfPermission(
                        android.Manifest.permission.SCHEDULE_EXACT_ALARM) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    android.util.Log.w("ReminderPlugin",
                            "SCHEDULE_EXACT_ALARM permission not granted, will use inexact alarm");
                }
            }

            scheduleReminderInternal(habitIcon, habitName, message, timeInMillis, notificationId);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Reminder scheduled");
            call.resolve(result);
        } catch (Exception e) {
            android.util.Log.e("ReminderPlugin", "Error scheduling reminder: " + e.getMessage());
            call.reject("Error scheduling reminder: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelReminder(PluginCall call) {
        int notificationId = call.getInt("notificationId", 0);

        if (notificationId == 0) {
            call.reject("Missing notificationId");
            return;
        }

        try {
            cancelReminderInternal(notificationId);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Reminder canceled");
            call.resolve(result);
        } catch (Exception e) {
            android.util.Log.e("ReminderPlugin", "Error canceling reminder: " + e.getMessage());
            call.reject("Error canceling reminder: " + e.getMessage());
        }
    }

    private void scheduleReminderInternal(String habitIcon, String habitName, String message, long timeInMillis,
            int notificationId) {
        Context context = getActivity().getApplicationContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, ReminderReceiver.class);
        intent.setAction("com.rexforge.quantumhabits.REMINDER");
        intent.putExtra("habitIcon", habitIcon);
        intent.putExtra("habitName", habitName);
        intent.putExtra("message", message);
        intent.putExtra("notificationId", notificationId);

        // Use FLAG_IMMUTABLE for better security on newer Android versions
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                intent,
                flags);

        try {
            // For Android 12+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                try {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent);
                    android.util.Log.d("ReminderPlugin", "Alarm scheduled with setAndAllowWhileIdle (Android 12+)");
                } catch (SecurityException e) {
                    android.util.Log.w("ReminderPlugin", "SCHEDULE_EXACT_ALARM not available, using inexact");
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent);
                }
            }
            // For Android 5-11
            else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                try {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent);
                    android.util.Log.d("ReminderPlugin",
                            "Alarm scheduled with setExactAndAllowWhileIdle (Android 5-11)");
                } catch (SecurityException e) {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent);
                }
            }
            // Fallback for older devices
            else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent);
                android.util.Log.d("ReminderPlugin", "Alarm scheduled with set() (older Android)");
            }

            long delayMs = timeInMillis - System.currentTimeMillis();
            android.util.Log.d("ReminderPlugin",
                    "Alarm will trigger in " + delayMs + "ms for notification " + notificationId);
        } catch (Exception e) {
            android.util.Log.e("ReminderPlugin", "Error setting alarm: " + e.getMessage());
            throw e;
        }
    }

    private void cancelReminderInternal(int notificationId) {
        Context context = getActivity().getApplicationContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, ReminderReceiver.class);
        intent.setAction("com.rexforge.quantumhabits.REMINDER");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                intent,
                flags);

        try {
            alarmManager.cancel(pendingIntent);
            android.util.Log.d("ReminderPlugin", "Alarm canceled for notification " + notificationId);
        } catch (Exception e) {
            android.util.Log.e("ReminderPlugin", "Error canceling alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setSystemBarColors(PluginCall call) {
        String color = call.getString("color", "#ffffff");
        boolean darkButtons = call.getBoolean("darkButtons", true);

        getActivity().runOnUiThread(() -> {
            try {
                android.view.Window window = getActivity().getWindow();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                    window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
                    window.setNavigationBarColor(android.graphics.Color.parseColor(color));

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        android.view.View decorView = window.getDecorView();
                        int flags = decorView.getSystemUiVisibility();
                        if (darkButtons) {
                            flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        } else {
                            flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        }
                        decorView.setSystemUiVisibility(flags);
                    }
                }
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }
}
