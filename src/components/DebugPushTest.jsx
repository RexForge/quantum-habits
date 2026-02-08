import React, { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';

export default function DebugPushTest() {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState('unknown');
  const [lastNotification, setLastNotification] = useState(null);
  const [lastActionNotification, setLastActionNotification] = useState(null);
  const [error, setError] = useState(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('DebugPushTest: Starting FCM init...');
        setIsNative(true);

        console.log('DebugPushTest: Requesting permissions...');
        const p = await PushNotifications.requestPermissions();
        console.log('DebugPushTest: Permission result:', p);
        setPermission(p.receive === 'granted' ? 'granted' : p.receive);

        // Set up listeners BEFORE calling register() so we catch the registration event
        PushNotifications.addListener('registration', (t) => {
          console.log('DebugPushTest: registration listener fired:', t);
          setToken(t.value);
        });

        PushNotifications.addListener('pushNotificationReceived', (n) => {
          console.log('DebugPushTest: pushNotificationReceived:', n);
          setLastNotification(n);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (n) => {
          console.log('DebugPushTest: pushNotificationActionPerformed:', n);
          setLastActionNotification(n);
          // Also set it as last notification so it's visible
          setLastNotification(n);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('DebugPushTest: registrationError:', err);
          setError(`Registration error: ${err.error}`);
        });

        console.log('DebugPushTest: Calling register()...');
        await PushNotifications.register();
        console.log('DebugPushTest: Register call completed');

      } catch (e) {
        console.error('DebugPushTest: init error', e);
        setError(`FCM init error: ${e.message}`);
      }
    };

    if (window.Capacitor?.isNativePlatform()) {
      init();
    } else {
      setError('Not running on native platform');
      console.log('DebugPushTest: Not native platform');
    }
  }, []);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '');
      alert('Copied');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border">
      <h4 className="font-bold mb-2">Push Notification Test (Debug)</h4>
      {error && <div className="text-xs text-red-600 dark:text-red-400 mb-2">⚠️ {error}</div>}
      <div className="text-sm mb-2">Platform: <strong>{isNative ? 'Native ✓' : 'Web (FCM disabled)'}</strong></div>
      <div className="text-sm mb-2">Permission: <strong>{permission}</strong></div>
      <div className="text-sm mb-2">FCM Token: <code className="break-words text-xs">{token || 'not registered'}</code></div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => copy(token)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Copy Token</button>
      </div>

      <div className="text-sm font-medium mb-1">Last notification (raw)</div>
      <pre className="text-xs p-2 rounded bg-white dark:bg-gray-900 overflow-auto max-h-48">{lastNotification ? JSON.stringify(lastNotification, null, 2) : 'No notification received yet (tap a notification to see it here)'}</pre>

      <div className="text-xs text-muted mt-2">
        <strong>Note:</strong> Background notifications appear in the system tray. Tap the notification to trigger the listener and see it here. Foreground notifications (while app is open) will appear automatically.
      </div>
    </div>
  );
}
