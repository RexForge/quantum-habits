import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, CheckCircle, Flame, Trophy, Settings, Sun, Moon, Clock, Trash2, Edit2, TrendingUp, BarChart, Calendar, ChevronLeft, ChevronRight, FileText, MessageSquare, Bell, Users, Menu, Sparkles, Globe, LogOut, RefreshCcw, Edit3, Camera, Upload, X } from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import FeedView from './components/social/FeedView';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import { db, storage } from './lib/firebase';
import { THEMES, getThemeColors } from './lib/themes';
import { ref, get, set, onValue, off, push } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Register the ReminderPlugin
const ReminderPlugin = registerPlugin('ReminderPlugin', {
  web: () => Promise.resolve({}), // Fallback for web
});

// Clean Mobile-First Habit Tracker
const HabitTracker = () => {
  const { user, loading: authLoading, logout, updateUserProfile } = useAuth();
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [];
  });

  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('colorTheme') || 'default');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [habitForm, setHabitForm] = useState({ name: '', icon: '🎯', color: '#3b82f6' });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [currentView, setCurrentView] = useState('habits'); // 'habits', 'weekly', 'stats', 'feed'
  const [showAccount, setShowAccount] = useState(false);
  const touchStart = React.useRef(null);
  const touchEnd = React.useRef(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navEdgeWidth = 32; // px from left edge to detect drawer swipe
  const navSwipeActive = React.useRef(false);
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [editingNote, setEditingNote] = useState(null); // { habitId, dateStr }
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [showReminders, setShowReminders] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [reminderForm, setReminderForm] = useState({ habitId: null, time: '09:00', message: '' });
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [profilePicModalMode, setProfilePicModalMode] = useState('options'); // 'options', 'upload', 'camera', 'premade'
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = React.useRef(null);

  const premadeAvatars = [
    { name: 'Avatar 1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1&backgroundColor=random' },
    { name: 'Avatar 2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2&backgroundColor=random' },
    { name: 'Avatar 3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3&backgroundColor=random' },
    { name: 'Avatar 4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4&backgroundColor=random' },
    { name: 'Avatar 5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5&backgroundColor=random' },
    { name: 'Avatar 6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6&backgroundColor=random' },
    { name: 'Avatar 7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7&backgroundColor=random' },
    { name: 'Avatar 8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8&backgroundColor=random' },
  ];

  const [noteText, setNoteText] = useState('');
  const [direction, setDirection] = useState(0);

  const viewOrder = {
    'habits': 0,
    'weekly': 1,
    'feed': 2,
    'groups': 3,
    'stats': 4
  };

  const handleViewChange = (newView) => {
    const newIndex = viewOrder[newView];
    const currentIndex = viewOrder[currentView];
    if (newIndex === currentIndex) return;
    setDirection(newIndex > currentIndex ? 1 : -1);
    setCurrentView(newView);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    })
  };

  const transition = {
    x: { type: "tween", ease: "easeInOut", duration: 0.4 },
    opacity: { duration: 0.2 },
    y: { duration: 0 },
    layout: { duration: 0 }
  };

  // Standard Compatibility Emoji Library
  const iconOptions = [
    '🎯', '💧', '🏃', '🚴', '🏊', '🏋️', '🧘', '🚶', '💪', '🧠', '❤️', '💊', '🛀', '🛌', '🥗', '🍎',
    '📚', '📝', '✏️', '📖', '💻', '🖥️', '📱', '📅', '⏰', '⏱️', '📋', '📈', '📊', '💼', '💡', '🔬',
    '🎨', '🎥', '🎬', '📸', '🎵', '🎶', '🎷', '🎸', '🎹', '🎮', '🕹️', '🖌️', '🧶', '🧵', '📻', '📺',
    '☕', '🍵', '🥤', '🍼', '🍌', '🍇', '🍓', '🥑', '🥩', '🍚', '🥖', '🥨', '🍕', '🍳', '🍨', '🍩',
    '🌱', '🌿', '🌲', '🌳', '🌴', '🌺', '🌸', '🌞', '🌙', '⭐', '☁️', '⚡', '🔥', '🌈', '🌊', '🏡',
    '✈️', '⛵', '🚀', '🚗', '🚲', '🛴', '🗺️', '⛰️', '🏖️', '🏜️', '🏕️', '⛺', '🚌', '🚆', '🚢', '🎡',
    '✨', '🌟', '🎨', '🎁', '🎉', '🎈', '💰', '💳', '🔑', '🏷️', '🔔', '💬', '🧹', '🧺', '🛌', '🛒',
    '😊', '🥳', '😎', '😴', '🙌', '👏', '🤝', '👍', '👎', '🤞', '👌', '✌️', '🪥', '🙏', '💯', '🔥'
  ];

  // Expanded Unique Color Palette (50+ shades)
  const colorOptions = [
    // Blues
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#60a5fa',
    // Cyans & Teals
    '#06b6d4', '#0891b2', '#0e7490', '#14b8a6', '#0d9488', '#0f766e',
    // Greens
    '#10b981', '#059669', '#047857', '#22c55e', '#16a34a', '#15803d', '#84cc16', '#65a30d', '#4d7c0f',
    // Yellows & Ambers
    '#f59e0b', '#d97706', '#b45309', '#eab308', '#ca8a04', '#a16207',
    // Oranges & Reds
    '#f97316', '#ea580c', '#c2410c', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    // Roses & Pinks
    '#f43f5e', '#e11d48', '#be185d', '#ec4899', '#db2777', '#9d174d',
    // Purples & Fuchsias
    '#d946ef', '#c026d3', '#a21caf', '#a855f7', '#9333ea', '#7e22ce',
    // Indigos & Violets
    '#6366f1', '#4f46e5', '#4338ca', '#8b5cf6', '#7c3aed', '#6d28d9',
    // Slates & Neutrals
    '#475569', '#334155', '#1e293b'
  ];

  // Firestore Sync & Local Persistence
  useEffect(() => {
    localStorage.setItem('colorTheme', colorTheme);
    localStorage.setItem('themeMode', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [colorTheme, themeMode]);

  // For backward compatibility with existing code that uses "theme"
  const theme = themeMode;

  // Get current theme colors
  const themeColors = getThemeColors(colorTheme, themeMode);

  // Apply theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', themeColors.primary);
    root.style.setProperty('--color-secondary', themeColors.secondary);
    root.style.setProperty('--color-accent', themeColors.accent);
  }, [themeColors]);

  // Sync Habits with Firestore
  useEffect(() => {
    if (!user) return;

    // 1. Initial Load from Realtime Database
    const loadHabits = async () => {
      try {
        const userHabitsRef = ref(db, `userHabits/${user.uid}`);
        const snapshot = await get(userHabitsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const cloudHabits = data.habits || [];
          setHabits(cloudHabits);
        } else {
          // First time user? Push local habits to cloud
          const saved = localStorage.getItem('habits');
          if (saved) {
            const localHabits = JSON.parse(saved);
            if (localHabits.length > 0) {
              await set(userHabitsRef, { habits: localHabits });
            }
          }
        }
      } catch (err) {
        console.error("Cloud load failed:", err);
      }
    };

    loadHabits();

    // 2. Real-time Subscription (Optional but good for multi-device)
    const userHabitsRef = ref(db, `userHabits/${user.uid}`);
    const unsubscribe = onValue(userHabitsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Simple merge/override logic for now
        // In a real app we'd compare timestamps
      }
    });

    return () => off(userHabitsRef);
  }, [user]);

  // Save to Cloud & Local
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));

    if (user) {
      const syncToCloud = async () => {
        try {
          const userHabitsRef = ref(db, `userHabits/${user.uid}`);
          await set(userHabitsRef, {
            habits,
            lastUpdated: new Date().toISOString()
          });
        } catch (err) {
          console.error("Cloud sync failed:", err);
        }
      };
      // Debounce this in a real app
      syncToCloud();
    }
  }, [habits, user]);

  // System UI setup (Status Bar & Navigation Bar)
  useEffect(() => {
    const setupSystemUI = async () => {
      try {
        if (window.Capacitor?.isNativePlatform()) {
          const isDark = theme === 'dark';

          // Status Bar
          await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          await StatusBar.setBackgroundColor({ color: '#00000000' });
          await StatusBar.setOverlaysWebView({ overlay: true });

          // Navigation Bar (via Custom Bridge)
          await ReminderPlugin.setSystemBarColors({
            color: isDark ? '#030014' : '#ffffff',
            darkButtons: !isDark
          });
        }
      } catch (error) {
        console.log('System UI setup failed:', error);
      }
    };
    setupSystemUI();
  }, [theme]);

  // FCM Push Notifications Setup
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Request Local Notifications permissions (POST_NOTIFICATIONS for Android 13+)
        console.log('Requesting local notification permissions...');
        await LocalNotifications.requestPermissions();

        // Request push notification permissions
        console.log('Requesting FCM push notification permissions...');
        let permission = await PushNotifications.requestPermissions();
        setNotificationPermission(permission.receive === 'granted' ? 'granted' : 'denied');
        console.log('Push notification permission result:', permission);

        // Add listeners BEFORE calling register() so we catch the token
        PushNotifications.addListener('registration', (token) => {
          console.log('FCM Token from listener:', token.value);
          setFcmToken(token.value);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received in foreground:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('FCM Registration Error:', err.error);
        });

        // Local Notifications listeners
        LocalNotifications.addListener('localNotificationReceived', (notification) => {
          console.log('Local notification received:', notification);
        });

        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('Local notification action performed:', notification);
        });

        // Register with FCM (this will trigger the registration listener)
        await PushNotifications.register();

      } catch (error) {
        console.log('Push notifications not available:', error);
      }
    };

    if (window.Capacitor?.isNativePlatform()) {
      initializePushNotifications();
    }
  }, []);

  // Core functions
  const today = new Date().toDateString();

  const getHabitStreak = (habit) => {
    const completions = habit.completions || {};
    let streak = 0;
    let date = new Date();
    while (true) {
      const dateStr = date.toDateString();
      if (completions[dateStr]) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    // If nav is already open, don't start view-change swipe on background
    if (isNavOpen) return;

    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;

    // Potential left-edge swipe to open navigation
    const startX = e.targetTouches[0].clientX;
    if (startX <= navEdgeWidth) {
      navSwipeActive.current = true;
    } else {
      navSwipeActive.current = false;
    }
  };

  const onTouchMove = (e) => {
    // Handle drawer open gesture first
    if (navSwipeActive.current && !isNavOpen) {
      const currentX = e.targetTouches[0].clientX;
      const deltaX = currentX - touchStart.current;
      if (deltaX > minSwipeDistance) {
        setIsNavOpen(true);
        navSwipeActive.current = false;
        return;
      }
    }

    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    // If gesture was used for nav, don't also change view
    if (navSwipeActive.current || isNavOpen) {
      navSwipeActive.current = false;
      return;
    }

    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (currentView === 'habits') handleViewChange('weekly');
      else if (currentView === 'weekly') handleViewChange('feed');
      else if (currentView === 'feed') handleViewChange('groups');
      else if (currentView === 'groups') handleViewChange('stats');
    }
    if (isRightSwipe) {
      if (currentView === 'stats') handleViewChange('groups');
      else if (currentView === 'groups') handleViewChange('feed');
      else if (currentView === 'feed') handleViewChange('weekly');
      else if (currentView === 'weekly') handleViewChange('habits');
    }
  };

  const shareToNexus = async (habit, streak) => {
    if (!user) return;
    try {
      const now = Date.now();
      const postsRef = ref(db, 'posts');
      const newPostRef = push(postsRef);
      await set(newPostRef, {
        userId: user.uid,
        username: user.displayName || 'Harshita Eka',
        content: `Just hit a ${streak} day streak on ${habit.name}! 🔥`,
        text: `Just hit a ${streak} day streak on ${habit.name}! 🔥`, // fallback
        type: 'milestone',
        streak: streak,
        timestamp: now,
        createdAt: now,
        likes: 0,
        comments: 0
      });
    } catch (err) {
      console.error("Failed to share to Nexus:", err);
    }
  };

  const toggleHabitCompletion = (habitId, date = new Date()) => {
    const dateStr = date.toDateString();
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const completions = { ...habit.completions };
        const isNowComplete = !completions[dateStr];
        completions[dateStr] = isNowComplete;

        const updatedHabit = { ...habit, completions };

        // Share to Nexus if it's today and newly completed
        if (isNowComplete && dateStr === today && user) {
          const streak = getHabitStreak(updatedHabit);
          if (streak > 0) {
            shareToNexus(updatedHabit, streak);
          }
        }

        return updatedHabit;
      }
      return habit;
    }));
  };

  const saveHabitNote = (habitId, dateStr, text) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const notes = { ...(habit.notes || {}) };
        if (text.trim()) {
          notes[dateStr] = text;
        } else {
          delete notes[dateStr];
        }
        return { ...habit, notes };
      }
      return habit;
    }));
    setEditingNote(null);
    setNoteText('');
  };

  const addHabit = () => {
    if (!habitForm.name.trim()) return;
    const newHabit = {
      id: Date.now(),
      ...habitForm,
      completions: {},
      createdAt: new Date().toISOString()
    };
    setHabits(prevHabits => [...prevHabits, newHabit]);
    setHabitForm({ name: '', icon: '🎯', color: '#3b82f6' });
    setShowAddHabit(false);
  };

  const updateHabit = () => {
    if (!habitForm.name.trim()) return;
    setHabits(habits.map(habit =>
      habit.id === editingHabit.id
        ? { ...habit, name: habitForm.name, icon: habitForm.icon, color: habitForm.color }
        : habit
    ));
    setEditingHabit(null);
    setHabitForm({ name: '', icon: '🎯', color: '#3b82f6' });
  };

  const deleteHabit = (habitId) => {
    setHabits(habits.filter(h => h.id !== habitId));
  };

  // Reminder functions
  const scheduleReminder = async (habitId, time, message) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) {
        console.error('Habit not found:', habitId);
        return;
      }

      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // If time is in the past, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const notificationId = `reminder_${habitId}_${Date.now()}`;

      console.log('Scheduling reminder:', {
        id: notificationId,
        title: `${habit.icon} ${habit.name}`,
        time: reminderTime,
        body: message || `Time for your ${habit.name} habit!`
      });

      await LocalNotifications.schedule({
        notifications: [{
          id: parseInt(notificationId.replace(/\D/g, '').substring(0, 9)),
          title: `${habit.icon} ${habit.name}`,
          body: message || `Time for your ${habit.name} habit!`,
          schedule: {
            at: reminderTime
          },
          smallIcon: 'ic_stat_icon_config_sample',
          channelId: 'habit_reminders',
          autoCancel: true,
          priority: 5
        }]
      });

      console.log('Reminder scheduled successfully');

      // Schedule on native Android AlarmManager for background execution
      try {
        const timeInMillis = reminderTime.getTime();
        if (ReminderPlugin && ReminderPlugin.scheduleReminder) {
          console.log('Calling ReminderPlugin.scheduleReminder with:', {
            habitIcon: habit.icon,
            habitName: habit.name,
            message: message || `Time for your ${habit.name} habit!`,
            timeInMillis: timeInMillis,
            notificationId: parseInt(notificationId.replace(/\D/g, '').substring(0, 9))
          });
          await ReminderPlugin.scheduleReminder({
            habitIcon: habit.icon,
            habitName: habit.name,
            message: message || `Time for your ${habit.name} habit!`,
            timeInMillis: timeInMillis,
            notificationId: parseInt(notificationId.replace(/\D/g, '').substring(0, 9))
          });
          console.log('Native AlarmManager reminder scheduled successfully');
        } else {
          console.warn('ReminderPlugin or scheduleReminder method not available');
        }
      } catch (error) {
        console.warn('Could not schedule native AlarmManager reminder:', error);
      }

      // Add reminder to habit
      const updatedHabits = habits.map(h => {
        if (h.id === habitId) {
          const reminders = h.reminders || [];
          return {
            ...h,
            reminders: [...reminders, {
              id: notificationId,
              time,
              message,
              enabled: true
            }]
          };
        }
        return h;
      });
      setHabits(updatedHabits);
      setReminderForm({ habitId: null, time: '09:00', message: '' });
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      alert(`Error scheduling reminder: ${error.message}`);
    }
  };

  const addReminder = () => {
    if (!reminderForm.habitId || !reminderForm.time) return;
    scheduleReminder(reminderForm.habitId, reminderForm.time, reminderForm.message);
  };

  const deleteReminder = async (habitId, reminderId) => {
    try {
      const notificationIdNum = parseInt(reminderId.replace(/\D/g, '').substring(0, 9));
      await LocalNotifications.cancel({ notifications: [{ id: notificationIdNum }] });

      // Cancel native AlarmManager alarm
      try {
        if (ReminderPlugin && ReminderPlugin.cancelReminder) {
          console.log('Canceling native reminder:', notificationIdNum);
          await ReminderPlugin.cancelReminder({
            notificationId: notificationIdNum
          });
          console.log('Native AlarmManager reminder canceled');
        }
      } catch (error) {
        console.warn('Could not cancel native AlarmManager reminder:', error);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }

    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          reminders: (h.reminders || []).filter(r => r.id !== reminderId)
        };
      }
      return h;
    });
    setHabits(updatedHabits);
  };

  const getAllReminders = () => {
    const reminders = [];
    habits.forEach(habit => {
      (habit.reminders || []).forEach(reminder => {
        reminders.push({
          ...reminder,
          habitId: habit.id,
          habitName: habit.name,
          habitIcon: habit.icon,
          habitColor: habit.color
        });
      });
    });
    return reminders;
  };

  // Profile picture upload handler
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Store file for upload
    e.target.dataset.file = file;
  };

  const uploadProfilePicture = async () => {
    const fileInput = document.getElementById('profilePicInput');
    const file = fileInput?.files?.[0];

    if (!file || !user) return;

    setUploadingProfilePic(true);
    try {
      // Upload to Firebase Storage
      const storageRef = sRef(storage, `profile-pictures/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update user profile
      await updateUserProfile({ photoURL });

      // Reset state and close modal
      setProfilePicPreview(null);
      setShowProfilePicModal(false);
      setProfilePicModalMode('options');
      fileInput.value = '';
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const startCamera = async () => {
    try {
      // Check if camera access is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera is not supported on this device or browser.');
        return;
      }

      // Check if we're in a secure context (HTTPS required for camera)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setCameraError('Camera requires a secure connection (HTTPS). Please access this app over HTTPS.');
        return;
      }

      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setProfilePicModalMode('camera');

      // Set video stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 0);
    } catch (error) {
      console.error('Error accessing camera:', error);

      // Handle different error types
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please enable camera permissions in your browser settings and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera device found on this device. Please use a device with a camera.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError('Camera is in use by another application. Please close other apps using the camera and try again.');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintError') {
        setCameraError('Camera does not support the required settings. Please try a different device.');
      } else {
        setCameraError(`Could not access camera: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setProfilePicPreview(event.target.result);
            // Store blob for upload
            document.getElementById('cameraInput').dataset.blob = blob;
            setProfilePicModalMode('preview');
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraError(null);
    setProfilePicModalMode('options');
  };

  const uploadCameraPhoto = async () => {
    const cameraInput = document.getElementById('cameraInput');
    const blob = cameraInput?.dataset.blob;

    if (!blob || !user) return;

    setUploadingProfilePic(true);
    try {
      const storageRef = sRef(storage, `profile-pictures/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const photoURL = await getDownloadURL(storageRef);

      await updateUserProfile({ photoURL });

      setProfilePicPreview(null);
      setShowProfilePicModal(false);
      setProfilePicModalMode('options');
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const selectPremadeAvatar = async (avatarUrl) => {
    if (!user) return;

    setUploadingProfilePic(true);
    try {
      await updateUserProfile({ photoURL: avatarUrl });
      setProfilePicPreview(null);
      setShowProfilePicModal(false);
      setProfilePicModalMode('options');
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Failed to update profile picture. Please try again.');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const closeProfilePicModal = () => {
    stopCamera();
    setProfilePicPreview(null);
    setShowProfilePicModal(false);
    setProfilePicModalMode('options');
    const fileInput = document.getElementById('profilePicInput');
    if (fileInput) fileInput.value = '';
  };

  // Long press handlers
  const handleLongPressStart = (habit) => {
    const timer = setTimeout(() => {
      // Vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setSelectedHabitForCalendar(habit);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Stats
  const completedToday = habits.filter(h => h.completions?.[today]).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Advanced stats for progress view
  const getBestStreak = () => {
    let maxStreak = 0;
    habits.forEach(habit => {
      const streak = getHabitStreak(habit);
      if (streak > maxStreak) maxStreak = streak;
    });
    return maxStreak;
  };

  const getTotalCompletions = () => {
    let total = 0;
    habits.forEach(habit => {
      if (habit.completions) {
        total += Object.values(habit.completions).filter(v => v).length;
      }
    });
    return total;
  };

  const getWeeklyCompletionRate = () => {
    if (totalHabits === 0) return 0;
    let completedCount = 0;
    let totalPossible = totalHabits * 7;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      habits.forEach(habit => {
        if (habit.completions?.[dateStr]) completedCount++;
      });
    }

    return Math.round((completedCount / totalPossible) * 100);
  };

  const getMostConsistentHabit = () => {
    if (habits.length === 0) return null;
    let bestHabit = habits[0];
    let bestStreak = getHabitStreak(habits[0]);

    habits.forEach(habit => {
      const streak = getHabitStreak(habit);
      if (streak > bestStreak) {
        bestStreak = streak;
        bestHabit = habit;
      }
    });

    return bestStreak > 0 ? bestHabit : null;
  };

  // Theme
  const cardClasses = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  const NavButton = ({ id, label, icon: Icon, active }) => (
    <button
      onClick={() => handleViewChange(id)}
      className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 transition-all active:scale-95 ${active
        ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600')
        : (theme === 'dark' ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500')
        }`}
    >
      <div className={`relative ${active ? 'scale-110 -translate-y-0.5' : 'scale-100'} transition-all duration-300`}>
        <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        {active && (
          <motion.div
            layoutId="activeTab"
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ backgroundColor: themeColors.primary }}
          />
        )}
      </div>
      <span className={`text-[8.5px] font-black uppercase tracking-tight mt-1 truncate w-full px-1 ${active ? 'opacity-100' : 'opacity-40'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="bg-background text-foreground min-h-screen safe-area-padding">
      {/* Header */}
      {/* Header */}
      {/* Top Header System */}
      <div className={`sticky top-0 z-40 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-950/80 border-b border-white/5' : 'bg-white/90 border-b border-gray-100'} backdrop-blur-2xl`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsNavOpen(true)}
              className={`p-2 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {currentView === 'habits' ? 'Habits' :
                    currentView === 'weekly' ? 'Progress' :
                      currentView === 'feed' ? 'Nexus' :
                        currentView === 'stats' ? 'Insights' : 'Guilds'}
                </h1>
                {currentView === 'feed' && (
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${themeColors.primary}10`,
                      borderColor: `${themeColors.primary}40`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: themeColors.primary }}
                    />
                    <span
                      className="text-[10px] font-black uppercase tracking-wider"
                      style={{ color: themeColors.primary }}
                    >
                      Live
                    </span>
                  </div>
                )}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                {currentView === 'habits' ? `${completedToday}/${totalHabits} Tasked` :
                  currentView === 'weekly' ? 'Weekly Momentum' :
                    currentView === 'feed' ? 'Global Pulse' :
                      currentView === 'stats' ? 'Performance Alpha' : 'Community Power'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'feed' ? (
              <button
                onClick={() => {
                  setTempName(user?.displayName || 'Quantum Explorer');
                  setShowAccount(true);
                }}
                className={`flex items-center p-1 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'}`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs relative">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.uid || 'default'}&backgroundColor=transparent`}
                      alt="Avatar"
                      className="w-full h-full object-cover p-0.5"
                    />
                  )}
                </div>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReminders(true)}
                  className={`p-2 rounded-xl transition-all active:scale-95 relative ${theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                >
                  <Bell className="w-5 h-5" />
                  {getAllReminders().length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                      {getAllReminders().length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className={`p-2 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar for Habits View */}
        {currentView === 'habits' && totalHabits > 0 && (
          <div className="h-1 w-full bg-transparent overflow-hidden px-6 pb-2">
            <div className={`h-full w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                style={{
                  background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`,
                  boxShadow: `0_0_10px_${themeColors.primary}80`,
                }}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Swipeable Content Area */}
      <div
        className="pb-40 overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <ErrorBoundary>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {currentView === 'habits' && (
              <motion.div
                key="habits"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full px-4 py-6"
              >
                <div className="flex flex-col gap-4 w-full">
                  <AnimatePresence>
                    {habits.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No habits yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Create your first habit to get started
                      </p>
                      <Button
                        onClick={() => setShowAddHabit(true)}
                        className="rounded-full px-6 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                      >
                        Add Habit
                      </Button>
                    </motion.div>
                  ) : (
                    habits.map((habit, index) => {
                      const streak = getHabitStreak(habit);
                      const isCompletedToday = habit.completions?.[today];

                      return (
                        <motion.div
                          key={habit.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`${cardClasses} p-4 rounded-2xl border transition-all mobile-list-item select-none`}
                          onTouchStart={() => handleLongPressStart(habit)}
                          onTouchEnd={handleLongPressEnd}
                          onTouchCancel={handleLongPressEnd}
                          onMouseDown={() => handleLongPressStart(habit)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                                style={{ backgroundColor: habit.color }}
                              >
                                {habit.icon}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{habit.name}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    <span>{streak} day streak</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingNote({ habitId: habit.id, dateStr: today });
                                      setNoteText(habit.notes?.[today] || '');
                                      if (navigator.vibrate) navigator.vibrate(5);
                                    }}
                                    className="flex items-center gap-1.5 transition-all active:scale-90 px-1.5 py-0.5 rounded-lg"
                                    style={{
                                      color: habit.notes?.[today] ? themeColors.primary : '#9ca3af',
                                      backgroundColor: habit.notes?.[today] ? `${themeColors.primary}15` : 'transparent',
                                    }}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    {habit.notes?.[today] && <span className="text-[10px] font-black uppercase tracking-wider">Note</span>}
                                  </button>

                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHabitCompletion(habit.id);
                                if (navigator.vibrate) navigator.vibrate(15);
                              }}
                              className={`mobile-touch-target w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 ${isCompletedToday
                                ? 'border-transparent shadow-lg shadow-black/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
                                }`}
                              style={{
                                backgroundColor: isCompletedToday ? habit.color : 'transparent'
                              }}
                            >
                              <Check
                                strokeWidth={3}
                                className={`w-10 h-10 transition-all ${isCompletedToday ? 'text-white scale-110' : 'text-gray-200 dark:text-gray-700'
                                  }`}
                              />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {currentView === 'feed' && (
              <motion.div
                key="feed"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full"
              >
                <FeedView
                  theme={theme}
                  themeColors={themeColors}
                  showCreatePostModal={showCreatePost}
                  setShowCreatePostModal={setShowCreatePost}
                />
              </motion.div>
            )}


            {currentView === 'groups' && (
              <motion.div
                key="groups"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full px-6 py-12 text-center flex flex-col items-center justify-center gap-4"
              >
                <div
                  className="w-20 h-20 rounded-[2.5rem] mx-auto flex items-center justify-center mb-6"
                  style={{
                    backgroundColor: `${themeColors.primary}15`,
                    color: themeColors.primary,
                  }}
                >
                  <Users className="w-10 h-10" />
                </div>
                <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Guilds & Tribes</h2>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} max-w-[240px] mx-auto`}>
                  Join specialized communities to tackle challenges together.
                </p>
                <div className="pt-8">
                  <Button
                    className="rounded-2xl px-8 py-6 font-black uppercase tracking-widest text-[11px] shadow-xl text-white"
                    style={{
                      backgroundColor: themeColors.primary,
                      boxShadow: `0 20px 25px -5px ${themeColors.primary}40`,
                    }}
                  >
                    Explore Hubs
                  </Button>
                </div>
              </motion.div>
            )}

            {currentView === 'weekly' && (
              <motion.div
                key="weekly"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full px-4 py-6 flex flex-col gap-6"
              >
                {habits.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2 opacity-50">No habits to track yet</h3>
                  </div>
                ) : (
                  habits.map((habit) => (
                    <div
                      key={habit.id}
                      className={`${cardClasses} p-5 rounded-3xl border transition-all select-none shadow-sm`}
                      onTouchStart={() => handleLongPressStart(habit)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchCancel={handleLongPressEnd}
                      onMouseDown={() => handleLongPressStart(habit)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                    >
                      <div className="flex items-center gap-4 mb-5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-transform active:scale-90"
                          style={{ backgroundColor: habit.color }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-black text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{habit.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                              Weekly Target
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNote({ habitId: habit.id, dateStr: today });
                                setNoteText(habit.notes?.[today] || '');
                                if (navigator.vibrate) navigator.vibrate(5);
                              }}
                              className={`flex items-center transition-all active:scale-90 px-1.5 py-0.5 rounded-lg ${habit.notes?.[today]
                                ? theme === 'dark' ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50'
                                : 'text-gray-400 hover:text-gray-500'
                                }`}
                            >
                              <FileText className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-orange-500 font-black text-sm">
                            <Flame size={16} fill="currentColor" />
                            {getHabitStreak(habit)}
                          </div>
                        </div>
                      </div>

                      {/* Weekly Tiles */}
                      <div className="flex justify-between items-end gap-2 px-1">
                        {[...Array(7)].map((_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - (6 - i));
                          const dStr = d.toDateString();
                          const isDone = !!habit.completions?.[dStr];
                          const isToday = dStr === today;

                          return (
                            <div key={`${habit.id}-${dStr}`} className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleHabitCompletion(habit.id, d);
                                  if (navigator.vibrate) navigator.vibrate(12);
                                }}
                                className={`w-full aspect-square rounded-xl transition-all active:scale-90 border-2 shadow-sm ${isDone
                                  ? 'border-transparent'
                                  : `${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-100'}`
                                  }`}
                                style={{
                                  backgroundColor: isDone ? habit.color : '',
                                  opacity: isDone ? 1 : 0.8
                                }}
                              >
                                {isDone && <Check strokeWidth={3} className="w-full h-full p-2 text-white shadow-sm" />}
                              </button>
                              <span
                                className="text-[9px] font-black uppercase tracking-tighter"
                                style={{
                                  color: isToday ? themeColors.primary : (theme === 'dark' ? '#6b7280' : '#9ca3af'),
                                  transform: isToday ? 'scale(1.1)' : 'scale(1)',
                                }}
                              >
                                {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {currentView === 'stats' && (
              <motion.div
                key="stats"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full px-6 py-4 flex flex-col gap-6"
              >

                {/* Overview Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Streak</span>
                    </div>
                    <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
                      {getBestStreak()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">days in a row</div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {getTotalCompletions()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">completions</div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Weekly Rate</span>
                    </div>
                    <div className="text-3xl font-black text-green-600 dark:text-green-400">
                      {Math.min(100, getWeeklyCompletionRate())}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Weekly Completion Rate</div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</span>
                    </div>
                    <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                      {completionRate}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{completedToday}/{totalHabits} done</div>
                  </div>
                </div>

                {/* Most Consistent Habit */}
                {getMostConsistentHabit() && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Most Consistent Habit
                    </h4>
                    <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: getMostConsistentHabit().color }}
                        >
                          {getMostConsistentHabit().icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold">{getMostConsistentHabit().name}</h5>
                          <div className="flex items-center gap-2 text-sm text-orange-500 font-medium">
                            <Flame className="w-4 h-4" />
                            {getHabitStreak(getMostConsistentHabit())} day streak
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Habit Stats */}
                <div>
                  <h4 className="font-semibold mb-3">Habit Performance</h4>
                  <div className="space-y-3">
                    {habits.map(habit => {
                      const streak = getHabitStreak(habit);
                      const totalDone = habit.completions ? Object.values(habit.completions).filter(v => v).length : 0;

                      // Calculate actual weekly rate for this specific habit
                      let weekDone = 0;
                      for (let i = 0; i < 7; i++) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        if (habit.completions?.[d.toDateString()]) weekDone++;
                      }
                      const habitWeeklyRate = Math.round((weekDone / 7) * 100);

                      return (
                        <div
                          key={habit.id}
                          className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                              style={{ backgroundColor: habit.color }}
                            >
                              {habit.icon}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold">{habit.name}</h5>
                              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-500" />
                                  <span>{streak} day streak</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  <span>{totalDone} total</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Weekly Completion Rate</span>
                              <span className="font-semibold">{Math.min(100, habitWeeklyRate)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, habitWeeklyRate)}%`,
                                  backgroundColor: habit.color
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </div>

      {/* Side Navigation Drawer */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setIsNavOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className={`fixed inset-y-0 left-0 w-64 z-50 shadow-2xl flex flex-col status-bar-safe ${theme === 'dark' ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'}`}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="px-4 pt-8 pb-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Views
                  </span>
                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Navigate
                  </span>
                </div>
                <button
                  onClick={() => setIsNavOpen(false)}
                  className={`p-1.5 rounded-full text-xs font-bold active:scale-95 transition-all ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                >
                  ✕
                </button>
              </div>

              <div className="px-3 py-2 space-y-1 flex-1 overflow-y-auto">
                <p className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>System</p>
                <button
                  onClick={() => {
                    setShowSettings(true);
                    setIsNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left active:scale-[0.98] transition-all ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setShowReminders(true);
                    setIsNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left active:scale-[0.98] transition-all ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}
                >
                  <Bell className="w-4 h-4" />
                  Reminders
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button - Dynamic & Context Aware */}
      <AnimatePresence>
        {(currentView === 'habits' || currentView === 'weekly' || currentView === 'feed') && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => {
              if (currentView === 'feed') setShowCreatePost(true);
              else setShowAddHabit(true);
            }}
            className="fixed right-6 mobile-fab transition-all flex items-center justify-center active:scale-90 z-40 text-white shadow-2xl"
            style={{
              backgroundColor: themeColors.primary,
              boxShadow: `0 25px 50px -12px ${themeColors.primary}40`,
              bottom: 'calc(env(safe-area-inset-bottom) + 84px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.primary;
            }}
          >
            {currentView === 'feed' ? (
              <MessageSquare className="w-6 h-6 stroke-[2.5px]" />
            ) : (
              <Plus className="w-7 h-7 stroke-[3px]" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* BOTTOM NAVIGATION BAR (Strava/Instagram Style) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-950/90 border-t border-white/5' : 'bg-white/95 border-t border-gray-100'} backdrop-blur-2xl px-1 pt-2`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto gap-0">
          <NavButton
            id="habits"
            label="Habits"
            icon={Flame}
            active={currentView === 'habits'}
          />
          <NavButton
            id="weekly"
            label="Progress"
            icon={Calendar}
            active={currentView === 'weekly'}
          />
          <NavButton
            id="feed"
            label="Nexus"
            icon={Sparkles}
            active={currentView === 'feed'}
          />
          <NavButton
            id="groups"
            label="Groups"
            icon={Users}
            active={currentView === 'groups'}
          />
          <NavButton
            id="stats"
            label="Insights"
            icon={TrendingUp}
            active={currentView === 'stats'}
          />
        </div>
      </div>



      {/* Add Habit Modal */}
      {
        showAddHabit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe" onClick={() => setShowAddHabit(false)}>
            <div
              className={`${cardClasses} w-full mobile-bottom-sheet`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-sheet-handle" />
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add Habit</h3>
                <button
                  onClick={() => setShowAddHabit(false)}
                  className={`mobile-touch-target rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mobile-text-base font-medium mb-2">Habit Name</label>
                  <input
                    type="text"
                    value={habitForm.name}
                    onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                    className="mobile-input w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Drink water"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addHabit();
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block mobile-text-base font-medium mb-2">Icon</label>
                  <button
                    onClick={() => setShowIconPicker(true)}
                    className="mobile-btn w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-left flex items-center justify-between"
                  >
                    <span className="text-2xl">{habitForm.icon}</span>
                    <span className="mobile-text-sm text-gray-500 dark:text-gray-400">Tap to change</span>
                  </button>
                </div>

                <div>
                  <label className="block mobile-text-base font-medium mb-2">Color</label>
                  <div className="grid grid-cols-7 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setHabitForm({ ...habitForm, color })}
                        className={`mobile-touch-target w-10 h-10 rounded-full border-2 ${habitForm.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                          } transition-transform`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={addHabit}
                  className="mobile-btn w-full bg-blue-500 text-white hover:bg-blue-600"
                >
                  Create Habit
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Habit Modal */}
      {
        editingHabit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe" onClick={() => setEditingHabit(null)}>
            <div
              className={`${cardClasses} w-full mobile-bottom-sheet`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-sheet-handle" />
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Edit Habit</h3>
                <button
                  onClick={() => {
                    setEditingHabit(null);
                    setHabitForm({ name: '', icon: '🎯', color: '#3b82f6' });
                  }}
                  className={`mobile-touch-target rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mobile-text-base font-medium mb-2">Habit Name</label>
                  <input
                    type="text"
                    value={habitForm.name}
                    onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                    className="mobile-input w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Drink water"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateHabit();
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block mobile-text-base font-medium mb-2">Icon</label>
                  <button
                    onClick={() => setShowIconPicker(true)}
                    className="mobile-btn w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-left flex items-center justify-between"
                  >
                    <span className="text-2xl">{habitForm.icon}</span>
                    <span className="mobile-text-sm text-gray-500 dark:text-gray-400">Tap to change</span>
                  </button>
                </div>

                <div>
                  <label className="block mobile-text-base font-medium mb-2">Color</label>
                  <div className="grid grid-cols-7 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setHabitForm({ ...habitForm, color })}
                        className={`mobile-touch-target w-10 h-10 rounded-full border-2 ${habitForm.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                          } transition-transform`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (confirm('Delete this habit? This cannot be undone.')) {
                        deleteHabit(editingHabit.id);
                        setEditingHabit(null);
                        setHabitForm({ name: '', icon: '🎯', color: '#3b82f6' });
                      }
                    }}
                    className="flex-1 mobile-btn bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={updateHabit}
                    className="flex-[2] mobile-btn bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Icon Picker Modal */}
      {
        showIconPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-[70] modal-backdrop-safe" onClick={() => setShowIconPicker(false)}>
            <div
              className={`${cardClasses} w-full mobile-bottom-sheet max-h-[85vh] flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-sheet-handle" />
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Choose Icon</h3>
                <button
                  onClick={() => setShowIconPicker(false)}
                  className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-1 pb-10">
                <div className="grid grid-cols-5 gap-4">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => {
                        setHabitForm({ ...habitForm, icon });
                        setShowIconPicker(false);
                      }}
                      className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-3xl transition-all active:scale-90 shadow-sm ${habitForm.icon === icon
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        : theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'
                        }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Progress & Stats Modal */}
      {
        showProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe" onClick={() => setShowProgress(false)}>
            <div
              className={`${cardClasses} w-full mobile-bottom-sheet max-h-[85vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-sheet-handle" />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Progress & Stats</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your habit tracking journey
                  </p>
                </div>
                <button
                  onClick={() => setShowProgress(false)}
                  className={`mobile-touch-target rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ✕
                </button>
              </div>

              {/* Overview Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Streak</span>
                  </div>
                  <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
                    {getBestStreak()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">days in a row</div>
                </div>

                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                  </div>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                    {getTotalCompletions()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">completions</div>
                </div>

                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</span>
                  </div>
                  <div className="text-3xl font-black text-green-600 dark:text-green-400">
                    {getWeeklyCompletionRate()}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">completion rate</div>
                </div>

                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</span>
                  </div>
                  <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                    {completionRate}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{completedToday}/{totalHabits} done</div>
                </div>
              </div>

              {/* Most Consistent Habit */}
              {getMostConsistentHabit() && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Most Consistent Habit
                  </h4>
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: getMostConsistentHabit().color }}
                      >
                        {getMostConsistentHabit().icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold">{getMostConsistentHabit().name}</h5>
                        <div className="flex items-center gap-2 text-sm text-orange-500 font-medium">
                          <Flame className="w-4 h-4" />
                          {getHabitStreak(getMostConsistentHabit())} day streak
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Habit Stats */}
              <div>
                <h4 className="font-semibold mb-3">Habit Performance</h4>
                <div className="space-y-3">
                  {habits.map(habit => {
                    const streak = getHabitStreak(habit);
                    const totalDone = habit.completions ? Object.values(habit.completions).filter(v => v).length : 0;
                    const daysTracked = habit.createdAt ? Math.ceil((new Date() - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24)) : 0;
                    const habitCompletionRate = daysTracked > 0 ? Math.round((totalDone / daysTracked) * 100) : 0;

                    return (
                      <div
                        key={habit.id}
                        className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                            style={{ backgroundColor: habit.color }}
                          >
                            {habit.icon}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold">{habit.name}</h5>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                <span>{streak} day streak</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>{totalDone} total</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                            <span className="font-semibold">{habitCompletionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${habitCompletionRate}%`,
                                backgroundColor: habit.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Habit Calendar Modal */}
      {
        selectedHabitForCalendar && (() => {
          const habit = habits.find(h => h.id === selectedHabitForCalendar.id) || selectedHabitForCalendar;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe" onClick={() => setSelectedHabitForCalendar(null)}>
              <div
                className={`${cardClasses} w-full mobile-bottom-sheet max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-sheet-handle" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm"
                      style={{ backgroundColor: habit.color }}
                    >
                      {habit.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{habit.name}</h3>
                      <p className="text-sm text-gray-500">Monthly Progress</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingNote({ habitId: habit.id, dateStr: today });
                        setNoteText(habit.notes?.[today] || '');
                        if (navigator.vibrate) navigator.vibrate(5);
                      }}
                      className={`p-2 rounded-full transition-all active:scale-90 ${habit.notes?.[today]
                        ? theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                        : theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'
                        }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingHabit(habit);
                        setHabitForm({
                          name: habit.name,
                          icon: habit.icon,
                          color: habit.color
                        });
                        setSelectedHabitForCalendar(null);
                      }}
                      className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedHabitForCalendar(null)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className={`mb-6 overflow-hidden rounded-3xl border p-4 transition-colors duration-300 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/40' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setCalendarDate(newDate);
                      }}
                      className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h4 className={`font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setCalendarDate(newDate);
                      }}
                      className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <span key={day} className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const year = calendarDate.getFullYear();
                      const month = calendarDate.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const days = [];

                      // Empty slots before first day
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} />);
                      }

                      // Actual days
                      for (let i = 1; i <= daysInMonth; i++) {
                        const date = new Date(year, month, i);
                        const dateStr = date.toDateString();
                        const isCompleted = !!habit.completions?.[dateStr];
                        const isFutur = date > new Date();

                        days.push(
                          <button
                            key={`${habit.id}-${dateStr}`}
                            disabled={isFutur}
                            onClick={() => {
                              toggleHabitCompletion(habit.id, date);
                              if (navigator.vibrate) navigator.vibrate(10);
                            }}
                            className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90 ${isCompleted
                              ? 'text-white shadow-lg shadow-black/5'
                              : isFutur
                                ? 'opacity-10 cursor-not-allowed'
                                : `${theme === 'dark' ? 'bg-gray-900 border-2' : 'bg-white border-2'}`
                              }`}
                            style={{
                              backgroundColor: isCompleted ? habit.color : '',
                              borderColor: isCompleted ? 'transparent' : (theme === 'dark' ? `${habit.color}40` : `${habit.color}20`),
                              color: isCompleted ? 'white' : (theme === 'dark' ? '#9ca3af' : '#4b5563')
                            }}
                          >
                            {isCompleted ? <Check strokeWidth={4} className="w-full h-full p-1" /> : i}
                          </button>
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <span className="block text-xs opacity-50 mb-1">Streak</span>
                    <span className="text-lg font-black text-orange-500">{getHabitStreak(habit)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <span className="block text-xs opacity-50 mb-1">Total</span>
                    <span className="text-lg font-black text-blue-500">
                      {Object.values(habit.completions || {}).filter(v => v).length}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center">
                    <span className="block text-xs opacity-50 mb-1">Rate</span>
                    <span className="text-lg font-black text-green-500">
                      {(() => {
                        const totalDone = Object.values(habit.completions || {}).filter(v => v).length;
                        const daysTracked = Math.max(1, Math.ceil((new Date() - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24)));
                        const denominator = Math.max(daysTracked, totalDone);
                        return Math.round((totalDone / denominator) * 100);
                      })()}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      }

      {/* Habit Note Modal */}
      {
        editingNote && (() => {
          const habit = habits.find(h => h.id === editingNote.habitId);
          if (!habit) return null;

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-[60] modal-backdrop-safe" onClick={() => setEditingNote(null)}>
              <div
                className={`${cardClasses} w-full mobile-bottom-sheet max-h-[70vh] flex flex-col p-6`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-sheet-handle" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm"
                      style={{ backgroundColor: habit.color }}
                    >
                      <MessageSquare className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{habit.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">Daily Reflection • {editingNote.dateStr === today ? 'Today' : editingNote.dateStr}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingNote(null)}
                    className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 mb-6">
                  <textarea
                    autoFocus
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Any thoughts? Add a note!"
                    className={`w-full h-40 p-4 rounded-2xl border-2 transition-all resize-none font-medium focus:ring-0 ${theme === 'dark'
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600'
                      : 'bg-gray-50 border-gray-100 text-gray-800 placeholder-gray-400'
                      }`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingNote(null)}
                    className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveHabitNote(editingNote.habitId, editingNote.dateStr, noteText)}
                    className="flex-[2] py-4 rounded-2xl text-white font-black text-lg transition-all active:scale-95 shadow-lg"
                    style={{
                      backgroundColor: themeColors.primary,
                      boxShadow: `0 10px 15px -3px ${themeColors.primary}40`,
                    }}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      }

      {/* Account Sidebar */}
      <AnimatePresence>
        {showAccount && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[70]"
              onClick={() => setShowAccount(false)}
            />

            {/* Right Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 right-0 w-[85%] max-w-sm z-[71] shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-l border-gray-800' : 'bg-white border-l border-gray-200'}`}
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Account</h3>
                <button
                  onClick={() => setShowAccount(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center mb-10">
                  <div className="relative w-fit mb-4">
                    <button
                      onClick={() => setShowProfilePicModal(true)}
                      className="w-32 h-32 rounded-[64px] overflow-hidden shadow-2xl relative group transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                      style={{
                        background: `linear-gradient(to top right, ${themeColors.primary}, ${themeColors.secondary})`,
                        boxShadow: `0 10px 25px -5px ${themeColors.primary}40, 0 0 0 4px ${themeColors.primary}15`,
                      }}
                    >
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.uid || 'default'}&backgroundColor=transparent`}
                          alt="Avatar"
                          className="w-full h-full object-cover p-0.5"
                        />
                      )}

                      {/* Hover Overlay - Desktop */}
                      <div className="hidden sm:flex absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 rounded-[64px] items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                          <Camera className="w-6 h-6 text-white mb-1 mx-auto" />
                          <p className="text-xs font-bold text-white">Change Photo</p>
                        </div>
                      </div>
                    </button>

                    {/* Camera Edit Badge - Visible on all screens */}
                    <button
                      onClick={() => setShowProfilePicModal(true)}
                      className="absolute bottom-0 right-0 p-2.5 rounded-full text-white shadow-lg border-4 border-white dark:border-gray-900 active:scale-90 transition-transform"
                      style={{
                        backgroundColor: themeColors.primary,
                      }}
                      title="Change profile picture"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    {isEditingName ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (tempName.trim()) {
                            await updateUserProfile({ displayName: tempName });
                            setIsEditingName(false);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          autoFocus
                          className={`bg-transparent border-b-2 text-xl font-black text-center w-40 outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                          style={{ borderColor: themeColors.primary }}
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={() => setIsEditingName(false)}
                        />
                        <button
                          type="submit"
                          className="p-1 rounded-full text-white"
                          style={{ backgroundColor: themeColors.primary }}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {user?.displayName || 'Quantum Explorer'}
                        </h2>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.email}
                  </p>

                  <div
                    className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1"
                    style={{
                      backgroundColor: `${themeColors.primary}15`,
                      color: themeColors.primary,
                      borderColor: `${themeColors.primary}30`,
                    }}
                  >
                    Explorer Status
                  </div>
                </div>

                <div className="space-y-4">

                  {/* Theme Toggle within Account Sidebar */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-100 text-orange-500'}`}>
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <div className="text-sm font-bold">
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </div>
                    </div>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                      Switch
                    </button>
                  </div>


                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-black">Level 1</div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-60">Beginner</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-blue-500 w-[35%]" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold uppercase opacity-50">
                      <span>350 XP</span>
                      <span>1000 XP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowAccount(false);
                      setShowSettings(true);
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-98 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white border border-gray-100 hover:bg-gray-50 text-gray-900'} shadow-sm`}
                  >
                    <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} text-gray-500`}>
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-sm">Settings</div>
                      <div className="text-xs opacity-60">Preferences & Control</div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-30" />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to sign out?')) {
                      setShowAccount(false);
                      logout();
                    }
                  }}
                  className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
                <div className="text-center mt-4 text-[10px] font-bold uppercase tracking-widest opacity-30">
                  Version 1.0.0
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Picture Upload Modal - Always in front */}
      {showProfilePicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[9999] modal-backdrop-safe">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-t-3xl sm:rounded-3xl p-6 w-full sm:w-[90%] sm:max-w-md shadow-2xl max-h-[85vh] overflow-y-auto`}
          >
            {/* Header */}
            {profilePicModalMode !== 'camera' && (
              <div className="flex items-center justify-between mb-6 sm:mb-4">
                <h3 className={`text-2xl sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {profilePicModalMode === 'options' ? 'Change Profile Picture' : 'Preview'}
                </h3>
                <button
                  onClick={closeProfilePicModal}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Options Screen */}
            {profilePicModalMode === 'options' && (
              <div className="space-y-2 sm:space-y-3">
                {/* Upload Picture */}
                <button
                  onClick={() => setProfilePicModalMode('upload')}
                  className={`w-full p-5 sm:p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 border-2 min-h-[80px] sm:min-h-auto ${
                    theme === 'dark'
                      ? 'bg-gray-800/30 border-gray-700 hover:border-blue-500 hover:bg-blue-500/10'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500 flex-shrink-0">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base sm:text-sm">Upload Picture</div>
                    <div className="text-sm sm:text-xs opacity-60">From your device</div>
                  </div>
                </button>

                {/* Take Picture */}
                <button
                  onClick={startCamera}
                  className={`w-full p-5 sm:p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 border-2 min-h-[80px] sm:min-h-auto ${
                    theme === 'dark'
                      ? 'bg-gray-800/30 border-gray-700 hover:border-green-500 hover:bg-green-500/10'
                      : 'bg-gray-50 border-gray-200 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-green-500/20 text-green-500 flex-shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base sm:text-sm">Take Picture</div>
                    <div className="text-sm sm:text-xs opacity-60">Use your camera</div>
                  </div>
                </button>

                {/* Premade Avatars */}
                <button
                  onClick={() => setProfilePicModalMode('premade')}
                  className={`w-full p-5 sm:p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 border-2 min-h-[80px] sm:min-h-auto ${
                    theme === 'dark'
                      ? 'bg-gray-800/30 border-gray-700 hover:border-purple-500 hover:bg-purple-500/10'
                      : 'bg-gray-50 border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-500 flex-shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base sm:text-sm">Premade Avatars</div>
                    <div className="text-sm sm:text-xs opacity-60">Choose a generated avatar</div>
                  </div>
                </button>
              </div>
            )}

            {/* Upload Screen */}
            {profilePicModalMode === 'upload' && (
              <div className="space-y-4">
                <label
                  htmlFor="profilePicInput"
                  className={`block p-8 sm:p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/5'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className={`w-10 h-10 sm:w-8 sm:h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                    <div className="text-center">
                      <p className={`font-bold text-base sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Click to upload
                      </p>
                      <p className={`text-sm sm:text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        JPG, PNG (max 5MB)
                      </p>
                    </div>
                  </div>
                  <input
                    id="profilePicInput"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setProfilePicModalMode('options')}
                  className={`w-full py-4 sm:py-3 rounded-xl font-bold transition-all active:scale-95 text-base sm:text-sm ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Back
                </button>
              </div>
            )}

            {/* Camera Screen */}
            {profilePicModalMode === 'camera' && (
              <>
                {cameraError ? (
                  <div className="space-y-4 py-4">
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'} border-2 ${theme === 'dark' ? 'border-red-500/30' : 'border-red-200'}`}>
                      <div className="flex gap-3 items-start mb-3">
                        <div className="text-red-500 text-2xl">⚠️</div>
                        <div>
                          <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>Camera Access Error</h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>{cameraError}</p>
                        </div>
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-red-400/70' : 'text-red-600/70'} mt-4 space-y-1`}>
                        <p>• Make sure your browser has permission to access the camera</p>
                        <p>• Try refreshing the page and try again</p>
                        <p>• Or use the upload option instead</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCameraError(null);
                        setProfilePicModalMode('options');
                      }}
                      className={`w-full py-4 sm:py-3 rounded-xl font-bold transition-all active:scale-95 text-base sm:text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-800 hover:bg-gray-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      Back to Options
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 -mx-6 -my-6 flex flex-col h-full">
                    <div className="relative bg-black flex-1 overflow-hidden sm:rounded-2xl">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-6 pb-6 flex gap-3">
                      <button
                        onClick={stopCamera}
                        className={`flex-1 py-4 sm:py-3 rounded-xl font-bold transition-all active:scale-95 text-base sm:text-sm ${
                          theme === 'dark'
                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        Back
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="flex-1 py-4 sm:py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 active:scale-95 transition-all text-base sm:text-sm"
                      >
                        Capture
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Preview Screen */}
            {profilePicModalMode === 'preview' && profilePicPreview && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={profilePicPreview}
                    alt="Preview"
                    className="w-48 h-48 sm:w-40 sm:h-40 rounded-full object-cover ring-4 ring-blue-500/20"
                  />
                </div>
                <p className={`text-base sm:text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Preview of your new profile picture
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setProfilePicPreview(null);
                      const fileInput = document.getElementById('profilePicInput');
                      if (fileInput) fileInput.value = '';
                      const cameraInput = document.getElementById('cameraInput');
                      if (cameraInput) cameraInput.dataset.blob = null;
                      setProfilePicModalMode('options');
                    }}
                    className={`flex-1 py-4 sm:py-3 rounded-xl border font-bold transition-all active:scale-95 text-base sm:text-sm ${
                      theme === 'dark'
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={profilePicModalMode === 'preview' && document.getElementById('cameraInput')?.dataset.blob ? uploadCameraPhoto : uploadProfilePicture}
                    disabled={uploadingProfilePic}
                    className={`flex-1 py-4 sm:py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-base sm:text-sm ${
                      uploadingProfilePic
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {uploadingProfilePic ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Premade Avatars Screen */}
            {profilePicModalMode === 'premade' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {premadeAvatars.map((avatar) => (
                    <button
                      key={avatar.url}
                      onClick={() => selectPremadeAvatar(avatar.url)}
                      disabled={uploadingProfilePic}
                      className={`aspect-square rounded-full overflow-hidden ring-4 transition-all active:scale-90 hover:scale-110 ${
                        uploadingProfilePic ? 'opacity-50 cursor-not-allowed' : 'ring-transparent hover:ring-blue-500'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setProfilePicModalMode('options')}
                  className={`w-full py-4 sm:py-3 rounded-xl font-bold transition-all active:scale-95 text-base sm:text-sm ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Back
                </button>
              </div>
            )}

            {/* Hidden inputs */}
            <input id="cameraInput" type="hidden" />
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      {
        showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe">
            <div className={`${cardClasses} w-full mobile-bottom-sheet`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Color Theme Selection */}
                <div>
                  <h4 className="font-medium mb-3">App Theme</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(THEMES).map(([themeKey, themeData]) => (
                      <button
                        key={themeKey}
                        onClick={() => setColorTheme(themeKey)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                        style={{
                          borderColor: colorTheme === themeKey ? themeData.primary : undefined,
                          backgroundColor: colorTheme === themeKey ? `${themeData.primary}15` : undefined,
                        }}
                      >
                        <div className="text-2xl">{themeData.icon}</div>
                        <div className="flex gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: themeData.primary }}
                            title={themeData.name}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: themeData.secondary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: themeData.accent }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                          {themeData.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Light/Dark Mode Selection */}
                <div>
                  <h4 className="font-medium mb-3">Display Mode</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setThemeMode('light')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-white"
                      style={{
                        backgroundColor: themeMode === 'light' ? themeColors.primary : 'transparent',
                        borderColor: themeMode === 'light' ? themeColors.primary : '#d1d5db',
                        color: themeMode === 'light' ? 'white' : themeMode === 'dark' ? '#9ca3af' : '#374151',
                      }}
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </button>
                    <button
                      onClick={() => setThemeMode('dark')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-white"
                      style={{
                        backgroundColor: themeMode === 'dark' ? themeColors.primary : 'transparent',
                        borderColor: themeMode === 'dark' ? themeColors.primary : '#d1d5db',
                        color: themeMode === 'dark' ? 'white' : themeMode === 'light' ? '#9ca3af' : '#374151',
                      }}
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </button>
                  </div>
                </div>



                <div>
                  <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Push Notifications</h4>
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${notificationPermission === 'granted' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          <Bell size={18} />
                        </div>
                        <span className="text-sm font-bold">System Alerts</span>
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${notificationPermission === 'granted' ? 'text-green-500' : 'text-orange-500'}`}>
                        {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        )
      }

      {/* Reminders Modal */}
      {
        showReminders && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe" onClick={() => setShowReminders(false)}>
            <div
              className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} w-full mobile-bottom-sheet max-h-[85vh] overflow-y-auto rounded-t-3xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-sheet-handle" />
              <div className="flex items-center justify-between mb-6 p-6">
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Reminders</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getAllReminders().length} reminder{getAllReminders().length !== 1 ? 's' : ''} set
                  </p>
                </div>
                <button
                  onClick={() => setShowReminders(false)}
                  className={`mobile-touch-target rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ✕
                </button>
              </div>

              <div className="px-6 space-y-4 pb-6">
                {getAllReminders().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-lg font-medium mb-2">No reminders set</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Add a reminder below to get started
                    </p>
                  </div>
                ) : (
                  getAllReminders().map((reminder) => (
                    <div
                      key={`${reminder.habitId}-${reminder.id}`}
                      className={`p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: reminder.habitColor }}
                          >
                            {reminder.habitIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{reminder.habitName}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <Clock className="w-4 h-4" />
                              <span>{reminder.time}</span>
                            </div>
                            {reminder.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {reminder.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteReminder(reminder.habitId, reminder.id)}
                          className="mobile-touch-target p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {habits.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-3">Add New Reminder</h4>
                    <div className="space-y-3">
                      <select
                        value={reminderForm.habitId || ''}
                        onChange={(e) => setReminderForm({ ...reminderForm, habitId: Number(e.target.value) })}
                        className={`w-full p-3 border rounded-xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select habit...</option>
                        {habits.map(habit => (
                          <option key={habit.id} value={habit.id}>
                            {habit.icon} {habit.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={reminderForm.time}
                        onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                        className={`w-full p-3 border rounded-xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <input
                        type="text"
                        value={reminderForm.message}
                        onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                        placeholder="Reminder message (optional)"
                        className={`w-full p-3 border rounded-xl placeholder-gray-400 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && reminderForm.habitId) {
                            addReminder();
                          }
                        }}
                      />
                      <button
                        onClick={addReminder}
                        disabled={!reminderForm.habitId}
                        className="w-full mobile-btn bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Reminder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

const App = () => <HabitTracker />;

export default App;
