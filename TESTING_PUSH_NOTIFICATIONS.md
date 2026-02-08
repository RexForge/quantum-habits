# Testing Push Notifications (Firebase)

Steps to test push notifications coming directly from Firebase:

1. Install dependencies (adds `firebase-admin` for the send script):

```bash
npm install
```

2. Obtain a Firebase service account JSON for your project and save it to the repo root (or any path). Example name: `serviceAccount.json`.

3. Start the app on a physical device (Capacitor Android/iOS). Open the app and go to the main screen — the new "Push Notification Test (Debug)" panel shows the FCM token and last received payload.

4. Copy the token from the panel and run the send script from the project root:

```bash
node scripts/send-fcm-test.js --serviceAccount ./serviceAccount.json --token <FCM_TOKEN> --title "Test from Firebase" --body "Hello from Admin SDK"
```

Notes:
- The script uses the Firebase Admin SDK to send the message, so delivery originates from Firebase servers (authenticated with your service account).
- If you prefer sending to a topic instead of a token use `--topic <topicName>`.
- The app's debug panel prints the raw payload; verify fields such as `messageId` and the payload contents to confirm it came from Firebase.
