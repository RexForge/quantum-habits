// Enhanced Service Worker for QuantumHabits Push Notifications
const CACHE_NAME = 'quantumhabits-v2';
const NOTIFICATION_STORE = 'scheduled-notifications';

// Install event - cache resources and initialize storage
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/vite.svg',
          '/manifest.json'
        ]);
      }),
      // Initialize IndexedDB for persistent notification storage
      initializeNotificationStore()
    ])
  );
  self.skipWaiting();
});

// Initialize IndexedDB for storing scheduled notifications
function initializeNotificationStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('QuantumHabitsDB', 1);

    request.onerror = () => {
      console.log('IndexedDB not available, using localStorage fallback');
      resolve();
    };

    request.onsuccess = () => {
      console.log('IndexedDB initialized successfully');
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(NOTIFICATION_STORE)) {
        const store = db.createObjectStore(NOTIFICATION_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Activate event - clean up old caches and restore scheduled notifications
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Restore scheduled notifications
      restoreScheduledNotifications(),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Store scheduled notification in IndexedDB
function storeScheduledNotification(notification) {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('QuantumHabitsDB', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([NOTIFICATION_STORE], 'readwrite');
        const store = transaction.objectStore(NOTIFICATION_STORE);
        store.put(notification);
        resolve();
      };
      request.onerror = () => {
        // Fallback to localStorage
        const notifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
        notifications.push(notification);
        localStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
        resolve();
      };
    } catch (error) {
      console.log('Failed to store notification:', error);
      resolve();
    }
  });
}

// Remove scheduled notification from storage
function removeScheduledNotification(id) {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('QuantumHabitsDB', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([NOTIFICATION_STORE], 'readwrite');
        const store = transaction.objectStore(NOTIFICATION_STORE);
        store.delete(id);
        resolve();
      };
      request.onerror = () => {
        // Fallback to localStorage
        const notifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
        const filtered = notifications.filter(n => n.id !== id);
        localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));
        resolve();
      };
    } catch (error) {
      console.log('Failed to remove notification:', error);
      resolve();
    }
  });
}

// Restore scheduled notifications on service worker restart
function restoreScheduledNotifications() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('QuantumHabitsDB', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([NOTIFICATION_STORE], 'readonly');
        const store = transaction.objectStore(NOTIFICATION_STORE);
        const now = Date.now();

        store.openCursor().onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const notification = cursor.value;
            if (notification.timestamp > now) {
              // Reschedule the notification
              scheduleNotification(notification);
            } else {
              // Remove expired notification
              removeScheduledNotification(notification.id);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
      };
      request.onerror = () => {
        // Fallback to localStorage
        const notifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
        const now = Date.now();
        const activeNotifications = notifications.filter(n => n.timestamp > now);

        activeNotifications.forEach(notification => {
          scheduleNotification(notification);
        });

        // Update storage
        localStorage.setItem('scheduledNotifications', JSON.stringify(activeNotifications));
        resolve();
      };
    } catch (error) {
      console.log('Failed to restore notifications:', error);
      resolve();
    }
  });
}

// Schedule a notification with persistence
function scheduleNotification(notificationData) {
  const { id, timestamp, title, body, icon, badge, tag, data } = notificationData;
  const delay = timestamp - Date.now();

  if (delay <= 0) return;

  // Store the notification for persistence
  storeScheduledNotification(notificationData);

  // Schedule the actual notification
  setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: icon || '/vite.svg',
      badge: badge || '/vite.svg',
      tag,
      requireInteraction: true, // Keep notification visible until interacted with
      silent: false,
      actions: [
        {
          action: 'complete',
          title: 'Mark Complete',
          icon: '/vite.svg'
        },
        {
          action: 'snooze',
          title: 'Remind Later',
          icon: '/vite.svg'
        }
      ],
      data: { ...data, notificationId: id }
    }).then(() => {
      // Remove from storage after showing
      removeScheduledNotification(id);
    }).catch(error => {
      console.log('Failed to show notification:', error);
    });
  }, Math.min(delay, 2147483647)); // Max timeout is about 24.8 days
}

// Handle notification clicks with enhanced actions
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const action = event.action;
  const notificationData = event.notification.data || {};

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      let appUrl = self.location.origin;

      // Handle different actions
      if (action === 'complete') {
        // Mark habit as complete
        appUrl += `/?action=complete&habitId=${notificationData.habitId}`;
      } else if (action === 'snooze') {
        // Snooze reminder for 1 hour
        appUrl += `/?action=snooze&habitId=${notificationData.habitId}`;
      } else {
        // Default open action
        appUrl += `/?habitId=${notificationData.habitId}`;
      }

      // Check if there is already a window/tab open
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(appUrl).then(() => client.focus());
        }
      }

      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(appUrl);
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    const { habit, reminder, reminderTime } = event.data;

    const notificationId = `habit-${habit.id}-${reminderTime.getTime()}`;
    const notificationData = {
      id: notificationId,
      timestamp: reminderTime.getTime(),
      title: `🔔 ${habit.name}`,
      body: reminder.message || `Time to work on your ${habit.name} habit! 💪`,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: `habit-${habit.id}`,
      data: {
        habitId: habit.id,
        reminderIndex: reminder.index,
        type: 'habit-reminder',
        habitColor: habit.color
      }
    };

    scheduleNotification(notificationData);
  }

  if (event.data && event.data.type === 'CANCEL_REMINDERS') {
    const { habitId } = event.data;
    // Cancel all notifications for this habit
    // This would require tracking active timeouts, which is complex
    // For now, rely on the tag system and notification replacement
    console.log('Cancel reminders requested for habit:', habitId);
  }

  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    const testNotification = {
      id: 'test-' + Date.now(),
      timestamp: Date.now() + 1000, // 1 second from now
      title: '🧪 Test Notification',
      body: 'This is a test notification from QuantumHabits!',
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'test',
      data: { type: 'test' }
    };

    scheduleNotification(testNotification);
  }
});

// Enhanced push message handling
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.log('Failed to parse push data:', error);
      data = {
        title: 'QuantumHabits',
        body: event.data.text() || 'You have a new notification!'
      };
    }
  }

  const options = {
    body: data.body || 'Time for your habit!',
    icon: data.icon || '/vite.svg',
    badge: data.badge || '/vite.svg',
    tag: data.tag || 'push-notification',
    requireInteraction: true,
    silent: false,
    actions: data.actions || [
      {
        action: 'view',
        title: 'View Details',
        icon: '/vite.svg'
      }
    ],
    data: {
      ...data.extra,
      type: 'push',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'QuantumHabits', options)
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'habit-reminders-sync') {
    event.waitUntil(syncHabitReminders());
  }
});

// Sync habit reminders when coming back online
function syncHabitReminders() {
  // This would typically sync with a backend server
  // For now, just ensure our scheduled notifications are still active
  return restoreScheduledNotifications();
}

// Handle fetch events for caching
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
