package com.rexforge.quantumhabits;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class FCMService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        android.util.Log.d("FCMService", "Message received: " + remoteMessage.getMessageId());

        // Handle data payload
        if (remoteMessage.getData().size() > 0) {
            handleDataMessage(remoteMessage.getData());
        }

        // Handle notification payload
        if (remoteMessage.getNotification() != null) {
            handleNotificationMessage(remoteMessage.getNotification());
        }
    }

    @Override
    public void onNewToken(String token) {
        android.util.Log.d("FCMService", "New FCM token: " + token);
        // Save token to SharedPreferences
        getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("fcm_token", token)
            .apply();
    }

    private void handleDataMessage(java.util.Map<String, String> data) {
        String title = data.get("title") != null ? data.get("title") : "Habit Reminder";
        String body = data.get("body") != null ? data.get("body") : "Time for your habit!";
        String notificationId = data.get("notificationId") != null ? data.get("notificationId") : "1";

        postNotification(title, body, Integer.parseInt(notificationId));
    }

    private void handleNotificationMessage(RemoteMessage.Notification notification) {
        String title = notification.getTitle() != null ? notification.getTitle() : "Habit Reminder";
        String body = notification.getBody() != null ? notification.getBody() : "Time for your habit!";

        postNotification(title, body, (int) System.currentTimeMillis() % 10000);
    }

    private void postNotification(String title, String body, int notificationId) {
        Context context = getApplicationContext();
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Ensure channel exists
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "fcm_default",
                "Habit Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("FCM push notifications");
            channel.enableVibration(true);
            channel.setShowBadge(true);

            NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "fcm_default")
            .setAutoCancel(true)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVibrate(new long[]{0, 250, 250, 250});

        NotificationManager notificationManager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(notificationId, builder.build());

        android.util.Log.d("FCMService", "Notification posted: " + title);
    }
}
