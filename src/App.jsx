import React, { useState, useEffect } from 'react';
import { Plus, Check, CheckCircle, Flame, Settings, Sun, Moon, Bell, Clock, Trash2, Edit2, TrendingUp, BarChart, Calendar, ChevronLeft, ChevronRight, FileText, MessageSquare } from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';

// Clean Mobile-First Habit Tracker
const HabitTracker = () => {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [habitForm, setHabitForm] = useState({ name: '', icon: '🎯', color: '#3b82f6', reminders: [] });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [editingReminder, setEditingReminder] = useState(null);
  const [reminderForm, setReminderForm] = useState({ habitId: null, time: '09:00', message: '', enabled: true });
  const [showProgress, setShowProgress] = useState(false);
  const [currentView, setCurrentView] = useState('habits'); // 'habits', 'weekly', or 'stats'
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [editingNote, setEditingNote] = useState(null); // { habitId, dateStr }
  const [noteText, setNoteText] = useState('');

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

  // Persistence
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Status bar setup
  useEffect(() => {
    const setupStatusBar = async () => {
      try {
        if (window.Capacitor?.isNativePlatform()) {
          const isDark = theme === 'dark';
          await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          await StatusBar.setBackgroundColor({ color: '#00000000' });
          await StatusBar.setOverlaysWebView({ overlay: true });
        }
      } catch (error) {
        console.log('Status bar setup failed:', error);
      }
    };
    setupStatusBar();
  }, [theme]);

  // Notification permissions setup
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        if (window.Capacitor?.isNativePlatform()) {
          const result = await LocalNotifications.requestPermissions();
          setNotificationPermission(result.display);
          console.log('Notification permission:', result.display);
        } else if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
        }
      } catch (error) {
        console.log('Failed to request notification permissions:', error);
      }
    };
    requestPermissions();
  }, []);

  // Schedule all habit reminders
  useEffect(() => {
    const scheduleAllReminders = async () => {
      if (notificationPermission !== 'granted') return;

      // Cancel all existing notifications first
      try {
        if (window.Capacitor?.isNativePlatform()) {
          const pending = await LocalNotifications.getPending();
          if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({
              notifications: pending.notifications
            });
          }
        }
      } catch (error) {
        console.log('Failed to cancel notifications:', error);
      }

      // Schedule new notifications
      habits.forEach(habit => {
        if (habit.reminders && habit.reminders.length > 0) {
          scheduleHabitReminders(habit);
        }
      });
    };

    scheduleAllReminders();
  }, [habits, notificationPermission]);

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
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (currentView === 'habits') setCurrentView('weekly');
      else if (currentView === 'weekly') setCurrentView('stats');
    }
    if (isRightSwipe) {
      if (currentView === 'stats') setCurrentView('weekly');
      else if (currentView === 'weekly') setCurrentView('habits');
    }
  };

  const toggleHabitCompletion = (habitId, date = new Date()) => {
    const dateStr = date.toDateString();
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const completions = { ...habit.completions };
        completions[dateStr] = !completions[dateStr];
        return { ...habit, completions };
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
      reminders: habitForm.reminders || [],
      createdAt: new Date().toISOString()
    };
    setHabits(prevHabits => [...prevHabits, newHabit]);
    setHabitForm({ name: '', icon: '🎯', color: '#3b82f6', reminders: [] });
    setShowAddHabit(false);
  };

  const updateHabit = () => {
    if (!habitForm.name.trim()) return;
    setHabits(habits.map(habit =>
      habit.id === editingHabit.id
        ? { ...habit, name: habitForm.name, icon: habitForm.icon, color: habitForm.color, reminders: habitForm.reminders || [] }
        : habit
    ));
    setEditingHabit(null);
    setHabitForm({ name: '', icon: '🎯', color: '#3b82f6', reminders: [] });
  };

  const deleteHabit = (habitId) => {
    cancelHabitNotifications(habitId);
    setHabits(habits.filter(h => h.id !== habitId));
  };

  // Notification scheduling functions
  const scheduleHabitReminders = async (habit) => {
    if (!habit.reminders || habit.reminders.length === 0) return;
    if (notificationPermission !== 'granted') return;

    try {
      const notifications = [];
      const now = new Date();

      habit.reminders.forEach((reminder, index) => {
        if (!reminder.enabled) return;

        const [hours, minutes] = reminder.time.split(':').map(Number);
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);

        // Schedule for today if time hasn't passed
        if (reminderTime > now) {
          notifications.push({
            title: `${habit.icon} ${habit.name}`,
            body: reminder.message || `Time for your ${habit.name} habit!`,
            id: habit.id * 1000 + index,
            schedule: { at: reminderTime, repeats: true, every: 'day' },
            sound: 'default',
            extra: { habitId: habit.id, reminderIndex: index }
          });
        } else {
          // Schedule for tomorrow
          const tomorrowTime = new Date(reminderTime);
          tomorrowTime.setDate(tomorrowTime.getDate() + 1);
          notifications.push({
            title: `${habit.icon} ${habit.name}`,
            body: reminder.message || `Time for your ${habit.name} habit!`,
            id: habit.id * 1000 + index,
            schedule: { at: tomorrowTime, repeats: true, every: 'day' },
            sound: 'default',
            extra: { habitId: habit.id, reminderIndex: index }
          });
        }
      });

      if (notifications.length > 0 && window.Capacitor?.isNativePlatform()) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} reminders for ${habit.name}`);
      }
    } catch (error) {
      console.error('Failed to schedule reminders:', error);
    }
  };

  const cancelHabitNotifications = async (habitId) => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const pending = await LocalNotifications.getPending();
        const toCancel = pending.notifications.filter(n =>
          Math.floor(n.id / 1000) === habitId
        );
        if (toCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: toCancel });
        }
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  };

  const addReminderToHabit = (habitId) => {
    if (!reminderForm.time) return;

    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const reminders = [...(habit.reminders || []), {
          id: Date.now(),
          time: reminderForm.time,
          message: reminderForm.message || `Time for your ${habit.name} habit!`,
          enabled: true
        }];
        return { ...habit, reminders };
      }
      return habit;
    }));

    setReminderForm({ habitId: null, time: '09:00', message: '', enabled: true });
  };

  const updateReminderInHabit = (habitId, reminderId, updates) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const reminders = habit.reminders.map(r =>
          r.id === reminderId ? { ...r, ...updates } : r
        );
        return { ...habit, reminders };
      }
      return habit;
    }));
  };

  const deleteReminderFromHabit = (habitId, reminderId) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const reminders = habit.reminders.filter(r => r.id !== reminderId);
        return { ...habit, reminders };
      }
      return habit;
    }));
  };

  const getAllReminders = () => {
    const allReminders = [];
    habits.forEach(habit => {
      if (habit.reminders && habit.reminders.length > 0) {
        habit.reminders.forEach(reminder => {
          allReminders.push({
            ...reminder,
            habitId: habit.id,
            habitName: habit.name,
            habitIcon: habit.icon,
            habitColor: habit.color
          });
        });
      }
    });
    return allReminders.sort((a, b) => a.time.localeCompare(b.time));
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

  const allReminders = getAllReminders();
  const upcomingReminders = allReminders.filter(r => {
    if (!r.enabled) return false;
    const now = new Date();
    const [hours, minutes] = r.time.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    return reminderTime > now;
  }).slice(0, 5);

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
  const themeClasses = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClasses = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`${themeClasses} min-h-screen safe-area-padding`}>
      {/* Header */}
      {/* Header */}
      <div className={`px-6 py-4 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentView === 'habits' ? 'Habits' : currentView === 'weekly' ? 'Weekly Progress' : 'Progress & Stats'}
            </h1>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentView === 'habits'
                ? `${completedToday}/${totalHabits} completed today`
                : currentView === 'weekly'
                  ? `Keep your momentum going`
                  : 'Your personal habit analytics'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReminders(true)}
              className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} relative`}
            >
              <Bell className="w-5 h-5" />
              {upcomingReminders.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className={`flex p-1 rounded-2xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
          <button
            onClick={() => setCurrentView('habits')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${currentView === 'habits'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            Habits
          </button>
          <button
            onClick={() => setCurrentView('weekly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${currentView === 'weekly'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Weekly
            </div>
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all ${currentView === 'stats'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Stats
            </div>
          </button>
        </div>

        {/* Progress Bar */}
        {totalHabits > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Today's Progress</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Swipeable Content Area */}
      <div
        className="px-4 py-6 pb-40 space-y-4 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentView === 'habits' ? (
          // Habits View
          <>
            {habits.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No habits yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first habit to get started
                </p>
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-600 transition-colors"
                >
                  Add Habit
                </button>
              </div>
            ) : (
              habits.map((habit) => {
                const streak = getHabitStreak(habit);
                const isCompletedToday = habit.completions?.[today];
                const reminderCount = habit.reminders?.length || 0;

                return (
                  <div
                    key={habit.id}
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
                              className={`flex items-center gap-1.5 transition-all active:scale-90 px-1.5 py-0.5 rounded-lg ${habit.notes?.[today]
                                ? theme === 'dark' ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50'
                                : 'text-gray-400 hover:text-gray-500'
                                }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {habit.notes?.[today] && <span className="text-[10px] font-black uppercase tracking-wider">Note</span>}
                            </button>
                            {reminderCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Bell className="w-3 h-3" />
                                <span>{reminderCount}</span>
                              </div>
                            )}
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
                  </div>
                );
              })
            )}
          </>
        ) : currentView === 'weekly' ? (
          // Weekly Progress View
          <div className="space-y-6">
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
                        <div key={i} className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
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
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${isToday ? 'text-blue-500 scale-110' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Stats View
          <div className="space-y-6">
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
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddHabit(true)}
        className="fixed bottom-6 right-6 mobile-fab bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center fab-safe-area"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Reminders View Modal */}
      {showReminders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe" onClick={() => setShowReminders(false)}>
          <div
            className={`${cardClasses} w-full mobile-bottom-sheet max-h-[85vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet-handle" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Reminders</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {allReminders.length} reminder{allReminders.length !== 1 ? 's' : ''} set
                </p>
              </div>
              <button
                onClick={() => setShowReminders(false)}
                className={`mobile-touch-target rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ✕
              </button>
            </div>

            {/* Notification Permission Status */}
            {notificationPermission !== 'granted' && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Notifications Disabled
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Enable notifications in settings to receive reminders
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Reminders */}
            <div className="space-y-4">
              {allReminders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">No reminders set</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Edit a habit to add reminders
                  </p>
                </div>
              ) : (
                allReminders.map((reminder) => (
                  <div
                    key={`${reminder.habitId}-${reminder.id}`}
                    className={`p-4 rounded-2xl border transition-all ${reminder.enabled
                      ? theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      : 'opacity-50 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                      }`}
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
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{reminder.habitName}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Clock className="w-4 h-4" />
                            <span>{reminder.time}</span>
                          </div>
                          {reminder.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reminder.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateReminderInHabit(reminder.habitId, reminder.id, { enabled: !reminder.enabled })}
                          className={`w-11 h-6 rounded-full transition-colors relative toggle-switch ${reminder.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${reminder.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <button
                          onClick={() => deleteReminderFromHabit(reminder.habitId, reminder.id)}
                          className="mobile-touch-target p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Reminder Section */}
            {habits.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-3">Add New Reminder</h4>
                <div className="space-y-3">
                  <select
                    value={reminderForm.habitId || ''}
                    onChange={(e) => setReminderForm({ ...reminderForm, habitId: Number(e.target.value) })}
                    className="mobile-input w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="mobile-input w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={reminderForm.message}
                    onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                    placeholder="Reminder message (optional)"
                    className="mobile-input w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && reminderForm.habitId) {
                        addReminderToHabit(reminderForm.habitId);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (reminderForm.habitId) {
                        addReminderToHabit(reminderForm.habitId);
                      }
                    }}
                    disabled={!reminderForm.habitId}
                    className="mobile-btn w-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Reminder
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )
      }

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
                    setHabitForm({ name: '', icon: '🎯', color: '#3b82f6', reminders: [] });
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
                        setHabitForm({ name: '', icon: '🎯', color: '#3b82f6', reminders: [] });
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
      {selectedHabitForCalendar && (() => {
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
                        color: habit.color,
                        reminders: habit.reminders || []
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
                          key={i}
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
      })()}

      {/* Habit Note Modal */}
      {editingNote && (() => {
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
                  className="flex-[2] py-4 rounded-2xl bg-blue-500 text-white font-black text-lg transition-all active:scale-95 shadow-lg shadow-blue-500/25"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settings Modal */}
      {showSettings && (
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
              <div>
                <h4 className="font-medium mb-3">Theme</h4>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${theme === 'light'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${theme === 'dark'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>

              <div>
                <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Notifications</h4>
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
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

              <div>
                <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Data Management</h4>
                <button
                  onClick={() => {
                    if (confirm('Reset all habits? This cannot be undone.')) {
                      setHabits([]);
                      setShowSettings(false);
                    }
                  }}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-red-900/10 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'
                    }`}
                >
                  <span className="font-bold">Reset All Data</span>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

const App = () => <HabitTracker />;

export default App;
