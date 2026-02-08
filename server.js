// server.js - Production Node.js server for sending FCM notifications
// Deploy to: AWS Lambda, Google Cloud Run, or Firebase Cloud Functions

const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// ENDPOINT: POST /api/send-notification
app.post('/api/send-notification', async (req, res) => {
  try {
    const { deviceToken, title, body, data, habitIcon } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ error: 'deviceToken is required' });
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
        habitIcon: habitIcon || '🎯',
        ...data
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
      },
      webpush: {
        headers: {
          TTL: '86400'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('FCM Message sent:', response);

    res.json({
      success: true,
      messageId: response
    });
  } catch (error) {
    console.error('FCM Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT: POST /api/send-topic-notification
app.post('/api/send-topic-notification', async (req, res) => {
  try {
    const { topic, title, body, data, habitIcon } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const message = {
      topic: topic,
      notification: {
        title: title || 'Habit Reminder',
        body: body || 'Time for your habit!'
      },
      data: {
        title: title || 'Habit Reminder',
        body: body || 'Time for your habit!',
        habitIcon: habitIcon || '🎯',
        ...data
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

    const response = await admin.messaging().send(message);
    console.log('FCM Topic Message sent:', response);

    res.json({
      success: true,
      messageId: response
    });
  } catch (error) {
    console.error('FCM Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT: POST /api/send-multicast
app.post('/api/send-multicast', async (req, res) => {
  try {
    const { deviceTokens, title, body, data, habitIcon } = req.body;

    if (!deviceTokens || !Array.isArray(deviceTokens)) {
      return res.status(400).json({ error: 'deviceTokens array is required' });
    }

    const message = {
      notification: {
        title: title || 'Habit Reminder',
        body: body || 'Time for your habit!'
      },
      data: {
        title: title || 'Habit Reminder',
        body: body || 'Time for your habit!',
        habitIcon: habitIcon || '🎯',
        ...data
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

    const response = await admin.messaging().sendMulticast({
      tokens: deviceTokens,
      ...message
    });

    console.log('FCM Multicast sent:', response);

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });
  } catch (error) {
    console.error('FCM Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FCM Server running on port ${PORT}`);
});
