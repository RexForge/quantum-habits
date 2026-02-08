# Debugging Post Creation Issues

## Quick Checklist

1. **Check Firestore Security Rules** (Most Common Issue)
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `quantumhabits`
   - Navigate to: Firestore Database → Rules
   - Ensure you have rules that allow authenticated users to write to `posts`:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /posts/{postId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
         allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

2. **Check Firestore Indexes**
   - In Firebase Console → Firestore Database → Indexes
   - Look for any missing index errors in the console
   - If you see a "failed-precondition" error, click the link in the error message to create the required index

3. **View React Console Logs in Android App**

   ### Option A: Chrome DevTools (Recommended)
   1. Connect your Android device via USB
   2. Enable USB Debugging on your device
   3. Open Chrome browser on your computer
   4. Navigate to: `chrome://inspect/#devices`
   5. Find your device and click "inspect" next to your app
   6. This opens Chrome DevTools with the React console logs

   ### Option B: Android Studio Logcat
   1. Open Android Studio
   2. Open Logcat tab
   3. Filter by: `chromium` or `WebView`
   4. Look for console.log messages from your React app

4. **Test Network Connectivity**
   - Ensure your device has internet connection
   - Check if other Firebase operations work (like authentication)

## Enhanced Error Messages

The app now shows detailed error messages in the UI:
- **Permission Denied**: Your Firestore security rules are blocking writes
- **Network Error**: Connectivity issue
- **Index Required**: Missing Firestore index (click the link in error to create it)

## Debug Info

When creating a post, if an error occurs, click "Show Debug Info" in the error message to see:
- Step-by-step execution log
- User ID and post data
- Exact error codes and messages
- Stack traces

## Common Error Codes

- `permission-denied`: Firestore security rules blocking the operation
- `unavailable`: Network connectivity issue
- `deadline-exceeded`: Request timed out (network issue)
- `failed-precondition`: Missing Firestore index
- `invalid-argument`: Invalid data format

## Testing Firestore Write Permissions

To test if Firestore writes work:
1. Try creating a post
2. Check the error message in the UI
3. If you see "Permission denied", update your Firestore security rules
4. If you see "Network error", check your internet connection

## Next Steps

1. Try creating a post again
2. Check the error message displayed in the UI
3. Share the error message and debug info if the issue persists

