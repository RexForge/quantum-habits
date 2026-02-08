import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

function usage() {
  console.log(`Usage: node scripts/send-fcm-test.js --serviceAccount <path> --token <fcmToken> --title "..." --body "..."`);
  process.exit(1);
}

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i += 2) {
  const k = argv[i];
  const v = argv[i + 1];
  if (!v) break;
  args[k.replace(/^--/, '')] = v;
}

if (!args.serviceAccount || (!args.token && !args.topic)) {
  usage();
}

const serviceAccountPath = path.resolve(process.cwd(), args.serviceAccount);
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const message = {
  notification: {
    title: args.title || 'Test Notification',
    body: args.body || 'This is a test message sent from Firebase Admin SDK.'
  },
  android: {
    priority: 'high'
  }
};

if (args.token) message.token = args.token;
if (args.topic) message.topic = args.topic;

(async () => {
  try {
    const resp = await admin.messaging().send(message);
    console.log('Message sent, messageId:', resp);
    console.log('This message was sent via Firebase Admin SDK (directly from Firebase).');
    process.exit(0);
  } catch (err) {
    console.error('Error sending message:', err);
    process.exit(2);
  }
})();
