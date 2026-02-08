package com.rexforge.quantumhabits;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            android.util.Log.d("BootReceiver", "Device booted, reschedule reminders if needed");
            // Reminders will be rescheduled automatically when the app starts
            // This receiver is here as a placeholder for future boot-time logic
        }
    }
}
