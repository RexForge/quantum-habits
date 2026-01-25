import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Flame, Settings, Sun, Moon } from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';

// Clean Mobile-First Habit Tracker
const HabitTracker = () => {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Drink Water',
        icon: '💧',
        color: '#3b82f6',
        completions: {},
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [habitForm, setHabitForm] = useState({ name: '', icon: '🎯', color: '#3b82f6' });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Icon and color options
  const iconOptions = [
    '🎯', '💧', '🏃', '📚', '💼', '☕', '🎨', '🎵', '🏋️', '🧘',
    '📝', '🎬', '📖', '✏️', '🎹', '🎸', '🎤', '🖥️', '📱', '💻',
    '🛏️', '🛀', '🚿', '🍎', '🥗', '🥤', '🍵', '🧹', '🧽', '🧺',
    '🛒', '🚗', '🚌', '🚲', '🏠', '🏢', '🏥', '🏫', '💼', '💰',
    '📊', '📈', '📉', '📋', '📅', '⏰', '⏱️', '🕐', '💪', '🧠',
    '❤️', '🫀', '🫁', '🌱', '🌿', '🌳', '🌺', '🌞', '🌙', '⭐',
    '🌟', '✨', '🔥', '💎', '🎁', '🎉', '🎊', '🎈', '⚽', '🏀',
    '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🏒', '🏑', '🏉', '🎱',
    '🎯', '🎳', '🎲', '🎮', '🕹️', '🎵', '🎶', '🎼', '🎤', '🎧',
    '📻', '🎷', '🎺', '🪕', '🥁', '🎻', '🎸', '🎹', '🖼️', '🎨',
    '🖌️', '🖍️', '📐', '📏', '🔧', '🔨', '🛠️', '⚙️', '🔩', '⚖️',
    '🧲', '🧪', '🔬', '🌍', '🌎', '🌏', '🗺️', '🗻', '🏔️', '🏕️',
    '🏖️', '🏜️', '🏝️', '🏞️', '🏛️', '🏰', '🏯', '🏟️'
  ];

  const colorOptions = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
    '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e',
    '#eab308', '#22c55e', '#a855f7', '#fb7185', '#fbbf24', '#34d399',
    '#60a5fa', '#a78bfa', '#f87171', '#4ade80', '#fbbf24', '#f472b6',
    '#c084fc', '#38bdf8', '#fb923c'
  ];

  // Persistence
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
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

  const deleteHabit = (habitId) => {
    setHabits(habits.filter(h => h.id !== habitId));
  };

  // Stats
  const completedToday = habits.filter(h => h.completions?.[today]).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Theme
  const themeClasses = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClasses = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`${themeClasses} min-h-screen safe-area-padding modal-safe-area`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Habits</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completedToday}/{totalHabits} completed today
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="w-5 h-5" />
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

      {/* Habit List */}
      <div className="p-6 pb-40 space-y-4">
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

            return (
              <div
                key={habit.id}
                className={`${cardClasses} p-4 rounded-2xl border transition-all hover:shadow-md`}
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
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{streak} day streak</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleHabitCompletion(habit.id)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${isCompletedToday
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                  >
                    <CheckCircle className={`w-6 h-6 ${isCompletedToday ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddHabit(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center fab-safe-area"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe">
          <div
            className={`${cardClasses} w-full rounded-t-3xl p-6 border-t bottom-modal-safe`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add Habit</h3>
              <button
                onClick={() => setShowAddHabit(false)}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Habit Name</label>
                <input
                  type="text"
                  value={habitForm.name}
                  onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white text-gray-900"
                  placeholder="e.g., Drink water"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <button
                  onClick={() => setShowIconPicker(true)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white text-left flex items-center justify-between"
                >
                  <span className="text-2xl">{habitForm.icon}</span>
                  <span className="text-sm text-gray-500">Tap to change</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="grid grid-cols-7 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => setHabitForm({ ...habitForm, color })}
                      className={`w-8 h-8 rounded-full border-2 ${habitForm.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                        } transition-transform`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={addHabit}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                Create Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop-safe">
          <div className={`${cardClasses} w-full max-w-lg rounded-3xl p-6 border max-h-[80vh] overflow-hidden modal-safe-area`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Choose Icon</h3>
              <button
                onClick={() => setShowIconPicker(false)}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="grid gap-3 icon-grid-responsive">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    onClick={() => {
                      setHabitForm({ ...habitForm, icon });
                      setShowIconPicker(false);
                    }}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition-all hover:scale-110 ${habitForm.icon === icon
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-backdrop-safe">
          <div className={`${cardClasses} w-full rounded-t-3xl p-6 border-t bottom-modal-safe`}>
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
                <h4 className="font-medium mb-3">Data</h4>
                <button
                  onClick={() => {
                    if (confirm('Reset all habits? This cannot be undone.')) {
                      setHabits([]);
                      setShowSettings(false);
                    }
                  }}
                  className="text-red-500 hover:text-red-600 font-medium"
                >
                  Reset All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => <HabitTracker />;

export default App;
