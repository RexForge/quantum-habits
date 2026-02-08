// functions/index.js - Firebase Cloud Function for sending notifications
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// FUNCTION: Send notification to single device
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const { deviceToken, title, body, habitIcon } = data;

  if (!deviceToken) {
    throw new functions.https.HttpsError('invalid-argument', 'deviceToken required');
  }

  const message = {
    token: deviceToken,
    notification: {
      title: title || 'Habit Reminder',
      body: body || 'Time for your habit!'
    },
    data: {
      title: title || 'Habit Reminder',
      body: body || 'Time for your habit!',
      habitIcon: habitIcon || '🎯'
    },
    android: {
      priority: 'high',
      notification: {
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
        channelId: 'fcm_default',
        priority: 'max',
        defaultVibrateTimings: true,
        visibility: 'public'
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// FUNCTION: Send notification via HTTP endpoint
exports.sendNotificationHttp = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { deviceToken, title, body, habitIcon, apiKey } = req.body;

  // Verify API key (set in environment variables)
  if (apiKey !== process.env.FCM_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!deviceToken) {
    return res.status(400).json({ error: 'deviceToken required' });
  }

  const message = {
    token: deviceToken,
    notification: {
      title: title || 'Habit Reminder',
      body: body || 'Time for your habit!'
    },
    data: {
      title: title || 'Habit Reminder',
      body: body || 'Time for your habit!',
      habitIcon: habitIcon || '🎯'
    },
    android: {
      priority: 'high',
      notification: {
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
        channelId: 'fcm_default',
        priority: 'max',
        defaultVibrateTimings: true,
        visibility: 'public'
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    return res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('FCM Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// FUNCTION: Scheduled reminder - runs daily
exports.sendScheduledReminders = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const db = admin.firestore();
    const messaging = admin.messaging();

    try {
      // Get all users with reminders
      const users = await db.collection('users').get();

      for (const userDoc of users.docs) {
        const reminders = userDoc.data().reminders || [];
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if any reminder matches current time
        for (const reminder of reminders) {
          const [remHour, remMinute] = reminder.time.split(':').map(Number);
          
          if (remHour === currentHour && remMinute === currentMinute && reminder.enabled) {
            const fcmTokens = userDoc.data().fcmTokens || [];

            for (const token of fcmTokens) {
              try {
                await messaging.send({
                  token: token,
                  notification: {
                    title: `${reminder.habitIcon} ${reminder.habitName}`,
                    body: reminder.message || `Time for your ${reminder.habitName} habit!`
                  },
                  data: {
                    habitIcon: reminder.habitIcon,
                    habitName: reminder.habitName
                  },
                  android: {
                    priority: 'high',
                    notification: {
                      sound: 'default',
                      channelId: 'fcm_default',
                      priority: 'max',
                      visibility: 'public'
                    }
                  }
                });
              } catch (error) {
                console.error(`Failed to send reminder to ${token}:`, error);
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error in scheduled reminders:', error);
      return null;
    }
  });
