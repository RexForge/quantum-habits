import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';

export const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
    });
    return image.webPath;
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
};

export const getCurrentLocation = async () => {
  try {
    const position = await Geolocation.getCurrentPosition();
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return null;
  }
};

export const vibrate = async (style = ImpactStyle.Light) => {
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.error('Haptics error:', error);
  }
};

export const scheduleNotification = async (task) => {
  if (!task.reminder) return;
  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted') {
      const [hours, minutes] = task.reminder.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      if (reminderTime > new Date()) {
        await LocalNotifications.schedule({
          notifications: [{
            title: 'Task Reminder',
            body: `Time for: ${task.name}`,
            id: task.id,
            schedule: { at: reminderTime }
          }]
        });
      }
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
};

export const setupStatusBar = async (theme, setPaddingTop, setPaddingBottom) => {
  try {
    const info = await StatusBar.getInfo();
    setPaddingTop(info.height || 24);

    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#111827' : '#f3f4f6' });

    // Improved bottom safe area detection for Android navigation bar
    const isAndroid = /Android/i.test(navigator.userAgent);
    let bottomInset = 0;

    if (isAndroid) {
      // On Android, navigation bar is typically 48-56dp, but can vary
      // Use a more conservative estimate based on viewport differences
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const screenHeight = window.screen.height;
      const potentialNavBarHeight = screenHeight - window.innerHeight;

      // Android navigation bar is usually between 48-80px
      if (potentialNavBarHeight > 40 && potentialNavBarHeight < 120) {
        bottomInset = potentialNavBarHeight;
      } else {
        // Fallback: assume standard navigation bar height
        bottomInset = 48;
      }
    }

    setPaddingBottom(Math.max(0, bottomInset));
  } catch (error) {
    console.error('Status bar error:', error);
    setPaddingTop(24); // Fallback
    setPaddingBottom(48); // Default Android navigation bar height
  }
};
