import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Settings,
  Search,
  Grid,
  Activity,
} from 'lucide-react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';

const TaskTracker = () => {
  // ------------ state: tasks / habits ------------

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('sectograph_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 1,
        name: 'Meeting',
        description: 'Morning briefing',
        startTime: '11:00',
        endTime: '12:00',
        duration: 60,
        color: '#10b981',
        icon: 'M',
        completed: false,
        date: today,
        recurring: null,
        reminder: null,
        priority: 'medium',
        category: 'Work',
        notes: '',
      },
      {
        id: 2,
        name: 'Lunch',
        description: 'Going to Riviera café',
        startTime: '12:00',
        endTime: '13:00',
        duration: 60,
        color: '#ef4444',
        icon: '🍽️',
        completed: false,
        date: today,
        recurring: null,
        reminder: null,
        priority: 'low',
        category: 'Personal',
        notes: '',
      },
      {
        id: 3,
        name: 'Work',
        description: 'Project development',
        startTime: '13:00',
        endTime: '14:30',
        duration: 90,
        color: '#8b5cf6',
        icon: 'W',
        completed: false,
        date: today,
        recurring: null,
        reminder: null,
        priority: 'high',
        category: 'Work',
        notes: '',
      },
    ];
  });  

  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem('habitkit_habits');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });  

  // ------------ basic UI state ------------

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState(
    () => localStorage.getItem('sectograph_theme') || 'light'
  );
  const [paddingTop, setPaddingTop] = useState(0);
  const [paddingBottom, setPaddingBottom] = useState(0);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('clock'); // clock | calendar | habits | stats
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [clockFormat, setClockFormat] = useState(
    () => localStorage.getItem('sectograph_clock_format') || '24'
  );
  const [clockStyle, setClockStyle] = useState(
    () => localStorage.getItem('sectograph_clock_style') || 'arc'
  );
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);

  // controlled new-task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');

  // ------------ constants ------------

  const colorPalette = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#84cc16',
    '#14b8a6',
    '#6366f1',
    '#f43f5e',
  ];  

  const iconOptions = ['M', '🍽️', 'W', '📞', '☕', '📚', '💼', '🏃', '🎯', '💡', '🎨', '🎵', '🏋️', '📝', '🎬'];  

  const categories = ['Work', 'Personal', 'Health', 'Study', 'Social', 'Other'];  

  const priorities = [
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'low', label: 'Low', color: '#6b7280' },
  ];  

  // ------------ persistence + timer ------------

  useEffect(() => {
    localStorage.setItem('sectograph_tasks', JSON.stringify(tasks));
  }, [tasks]);  

  useEffect(() => {
    localStorage.setItem('habitkit_habits', JSON.stringify(habits));
  }, [habits]);  

  useEffect(() => {
    localStorage.setItem('sectograph_theme', theme);
  }, [theme]);  

  useEffect(() => {
    localStorage.setItem('sectograph_clock_format', clockFormat);
  }, [clockFormat]);  

  useEffect(() => {
    localStorage.setItem('sectograph_clock_style', clockStyle);
  }, [clockStyle]);  

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const fullHeight = window.screen.height;
        const visibleHeight = viewport.height;
        const topInset = fullHeight - visibleHeight - (window.innerHeight - visibleHeight);
        const bottomInset = Math.max(0, fullHeight - window.innerHeight);
        
        setPaddingTop(Math.max(0, topInset));
        setPaddingBottom(Math.max(0, bottomInset));
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      handleViewportChange(); // Initial call
    }
    
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);  

  // Status bar configuration
  useEffect(() => {
    const setStatusBar = async () => {
      try {
        const info = await StatusBar.getInfo();
        setPaddingTop(info.height || 24); // Default 24px if not available
        
        await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
        await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#111827' : '#f3f4f6' });
        
        // Detect bottom safe area (approximate)
        const vh = window.innerHeight;
        const fullHeight = window.screen.height;
        const bottomInset = Math.max(0, fullHeight - vh - (info.height || 24));
        setPaddingBottom(bottomInset > 0 ? bottomInset : 0);
      } catch (error) {
        console.error('Status bar error:', error);
        setPaddingTop(24); // Fallback
        setPaddingBottom(0);
      }
    };
    setStatusBar();
  }, [theme]);

  // ------------ helpers ------------

  const toDateStr = (d) => d.toISOString().split('T')[0];  

  const formatTime = (date, use12 = false) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: use12,
    });
  };  

  const formatTime12Hour = (time24) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')} ${period}`;
  };  

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'long',
    });  

  const getTasksForDate = (date) => {
    const ds = toDateStr(date);
    return tasks.filter((t) => (t.date || toDateStr(new Date())) === ds);
  };  

  // ------------ mobile enhancements ------------

  const takePhoto = async () => {
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

  const getCurrentLocation = async () => {
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

  const vibrate = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const scheduleNotification = async (task) => {
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

  // ------------ filtering + current task ------------

  const filteredTasks = useMemo(() => {
    let list = getTasksForDate(selectedDate);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'all') {
      list = list.filter((t) => t.category === filterCategory);
    }
    if (filterPriority !== 'all') {
      list = list.filter((t) => t.priority === filterPriority);
    }
    if (!showCompleted) {
      list = list.filter((t) => !t.completed);
    }
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, selectedDate, searchQuery, filterCategory, filterPriority, showCompleted]);  

  const currentTasks = filteredTasks;  

  const getTaskStatus = (task) => {
    if (task.completed) return 'completed';
    const now = currentTime;
    const nowM = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = task.startTime.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    if (nowM >= startM && nowM < endM) return 'current';
    if (nowM < startM) return 'upcoming';
    return 'past';
  };  

  const getCurrentActiveTask = () => {
    const nowM = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currentTasks.find((task) => {
      const [sh, sm] = task.startTime.split(':').map(Number);
      const [eh, em] = task.endTime.split(':').map(Number);
      const startM = sh * 60 + sm;
      const endM = eh * 60 + em;
      return nowM >= startM && nowM < endM && !task.completed;
    });
  };  

  const activeTask = getCurrentActiveTask();  
  const displayedTask =
    activeTask || (currentTasks.length ? currentTasks[currentTaskIndex] : null);  

  const getRemainingTime = (task) => {
    if (!task) return 0;
    const nowM = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [eh, em] = task.endTime.split(':').map(Number);
    const endM = eh * 60 + em;
    return Math.max(0, endM - nowM);
  };  

  const remainingMinutes = displayedTask ? getRemainingTime(displayedTask) : 0;
  const taskProgress = displayedTask
    ? ((displayedTask.duration - remainingMinutes) / displayedTask.duration) * 100
    : 0;  

  const timeToAngle = (time, is12 = false) => {
    const [h, m] = time.split(':').map(Number);
    if (is12) {
      const hh = h % 12 || 12;
      return hh * 30 + (m / 60) * 30 - 90;
    }
    return h * 15 + (m / 60) * 15 - 90;
  };  

  const getCurrentTimeAngle = (is12 = false) => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    if (is12) {
      const hh = h % 12 || 12;
      return hh * 30 + (m / 60) * 30 - 90;
    }
    return h * 15 + (m / 60) * 15 - 90;
  };  

  // ------------ calendar helpers ------------

  const getCalendarMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const startWeekday = first.getDay();
    const prevLast = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevLast - i),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  };  

  const getDayTaskStatus = (date) => {
    const ds = toDateStr(date);
    const dayTasks = tasks.filter((t) => t.date === ds);
    if (!dayTasks.length) return { hasTasks: false, completed: 0, total: 0 };
    const completed = dayTasks.filter((t) => t.completed).length;
    return { hasTasks: true, completed, total: dayTasks.length };
  };  

  // ------------ habit helpers ------------

  const getLastNDays = (n) => {
    const arr = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      arr.push(d);
    }
    return arr;
  };  

  const toggleHabitCompletion = (habitId, date) => {
    const ds = toDateStr(date);
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const completions = { ...(h.completions || {}) };
        const cur = completions[ds] || 0;
        completions[ds] = cur ? 0 : 1;
        return { ...h, completions };
      })
    );
  };  

  const getHabitProgress = (habit, today = new Date()) => {
    const completions = habit.completions || {};
    let total = 0;

    if (habit.frequencyType === 'daily') {
      getLastNDays(7).forEach((d) => {
        const k = toDateStr(d);
        if (completions[k]) total += completions[k];
      });
    } else if (habit.frequencyType === 'weekly') {
      const dow = today.getDay();
      const diffToMon = (dow + 6) % 7;
      const mon = new Date(today);
      mon.setDate(today.getDate() - diffToMon);
      for (let i = 0; i < 7; i++) {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        const k = toDateStr(d);
        if (completions[k]) total += completions[k];
      }
    } else if (habit.frequencyType === 'monthly') {
      const y = today.getFullYear();
      const m = today.getMonth();
      const first = new Date(y, m, 1);
      const next = new Date(y, m + 1, 1);
      for (let d = new Date(first); d < next; d.setDate(d.getDate() + 1)) {
        const k = toDateStr(d);
        if (completions[k]) total += completions[k];
      }
    }

    const target = habit.targetCount || 1;
    const ratio = Math.min(1, total / target);
    return { periodTotal: total, target, ratio };
  };  

  // ------------ CRUD ------------

  const addTask = (data) => {
    const newTask = {
      id: Date.now(),
      name: data.name,
      description: data.description || '',
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      color: data.color || colorPalette[0],
      icon: data.icon || '',
      date: data.date || toDateStr(selectedDate),
      completed: false,
      recurring: data.recurring || null,
      reminder: data.reminder || null,
      priority: data.priority || 'medium',
      category: data.category || 'Other',
      notes: data.notes || '',
      photos: data.photos || [],
      location: data.location || null,
    };
    setTasks((prev) => [...prev, newTask]);
    vibrate(ImpactStyle.Light);
    if (newTask.reminder) {
      scheduleNotification(newTask);
    }
  };  

  const toggleTaskComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    vibrate(ImpactStyle.Medium);
  };  

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };  

  const navigateTask = (dir) => {
    if (!currentTasks.length) return;
    setCurrentTaskIndex((prev) => {
      const idx = prev + dir;
      if (idx < 0) return currentTasks.length - 1;
      if (idx >= currentTasks.length) return 0;
      return idx;
    });
  };  

  const navigateDate = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };  

  const goToToday = () => setSelectedDate(new Date());  

  // ------------ new task submit (controlled) ------------

  const submitNewTask = (e) => {
    e.preventDefault();
    if (!newTaskName || !newTaskStart || !newTaskEnd) return;
    const [sh, sm] = newTaskStart.split(':').map(Number);
    const [eh, em] = newTaskEnd.split(':').map(Number);
    const duration = eh * 60 + em - (sh * 60 + sm);
    if (duration <= 0) return;
    addTask({
      name: newTaskName,
      startTime: newTaskStart,
      endTime: newTaskEnd,
      duration,
    });
    setNewTaskName('');
    setNewTaskStart('');
    setNewTaskEnd('');
    setShowAddTask(false);
  };  

  // ------------ subcomponents ------------

  const WidgetDashboard = () => {
    const today = toDateStr(new Date());
    const todayTasks = tasks.filter((t) => t.date === today);
    const completedTasks = todayTasks.filter((t) => t.completed);
    const currentList = todayTasks.filter((t) => getTaskStatus(t) === 'current');
    const upcoming = todayTasks.filter(
      (t) => getTaskStatus(t) === 'upcoming' && !t.completed
    );  

    return (
      <div
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-3xl shadow-2xl p-6 border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            Today&apos;s Overview
          </h3>
          <div
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              theme === 'dark'
                ? 'bg-gray-700 text-white'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {todayTasks.length} tasks
          </div>
        </div>

        {/* completed */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <span
              className={`text-sm font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Completed ({completedTasks.length})
            </span>
          </div>
          {completedTasks.length ? (
            <div className="space-y-1">
              {completedTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700/50' : 'bg-green-50'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p
              className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              No completed tasks yet
            </p>
          )}
        </div>

        {/* current */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-500" />
            <span
              className={`text-sm font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Current ({currentList.length})
            </span>
          </div>
          {currentList.length ? (
            <div className="space-y-1">
              {currentList.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'
                  } border-2 border-blue-500`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {t.name}
                  </span>
                  <span
                    className={`text-xs ml-auto ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {getRemainingTime(t)}m left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p
              className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              No active tasks
            </p>
          )}
        </div>

        {/* upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-orange-500" />
            <span
              className={`text-sm font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Upcoming ({upcoming.length})
            </span>
          </div>
          {upcoming.length ? (
            <div className="space-y-1">
              {upcoming.slice(0, 3).map((t) => {
                const [sh, sm] = t.startTime.split(':').map(Number);
                const nowM =
                  currentTime.getHours() * 60 + currentTime.getMinutes();
                const startM = sh * 60 + sm;
                const minutesUntil = startM - nowM;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-orange-50'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span
                      className={`text-xs ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {t.name}
                    </span>
                    <span
                      className={`text-xs ml-auto ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      in {minutesUntil}m
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p
              className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              No upcoming tasks
            </p>
          )}
        </div>
      </div>
    );
  };

  const PieChartClockView = () => {
    const is12 = clockFormat === '12';
    const hours = is12 ? 12 : 24;
    const hourAngle = is12 ? 30 : 15;  

    return (
      <div
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-3xl shadow-2xl p-4 md:p-6 border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {is12 ? '12-Hour' : '24-Hour'} Schedule
          </h3>
          <div
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              theme === 'dark'
                ? 'bg-gray-700 text-white'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {currentTasks.length} tasks
          </div>
        </div>

        <div className="relative w-full aspect-square max-w-sm max-h-64 mx-auto">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle
              cx="200"
              cy="200"
              r="180"
              fill={theme === 'dark' ? '#1f2937' : '#f9fafb'}
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
              strokeWidth="2"
            />

            {Array.from({ length: hours }).map((_, i) => {
              const angle = ((i * hourAngle - 90) * Math.PI) / 180;
              const x1 = 200 + 170 * Math.cos(angle);
              const y1 = 200 + 170 * Math.sin(angle);
              const x2 = 200 + 180 * Math.cos(angle);
              const y2 = 200 + 180 * Math.sin(angle);

              const curH = currentTime.getHours();
              const displayH = is12 ? curH % 12 || 12 : curH;
              const isCur =
                is12 ? (i === 0 ? 12 : i) === displayH : i === curH;

              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isCur
                        ? theme === 'dark'
                          ? '#60a5fa'
                          : '#3b82f6'
                        : theme === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : '#d1d5db'
                    }
                    strokeWidth={isCur ? 2 : 1}
                  />
                  <text
                    x={200 + 155 * Math.cos(angle)}
                    y={200 + 155 * Math.sin(angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-semibold"
                    fill={
                      isCur
                        ? theme === 'dark'
                          ? '#60a5fa'
                          : '#3b82f6'
                        : theme === 'dark'
                        ? 'rgba(255,255,255,0.6)'
                        : '#6b7280'
                    }
                  >
                    {is12 ? (i === 0 ? 12 : i) : i}
                  </text>
                </g>
              );
            })}

            {currentTasks
              .filter((t) => showCompleted || !t.completed)
              .map((t) => {
                const startA = timeToAngle(t.startTime, is12);
                let endA = timeToAngle(t.endTime, is12);
                if (endA <= startA) endA += 360;
                const startR = (startA * Math.PI) / 180;
                const endR = (endA * Math.PI) / 180;
                const largeArc = endA - startA > 180 ? 1 : 0;
                const radius = 180;
                const innerRadius = 100;
                const x1 = 200 + radius * Math.cos(startR);
                const y1 = 200 + radius * Math.sin(startR);
                const x2 = 200 + radius * Math.cos(endR);
                const y2 = 200 + radius * Math.sin(endR);
                const x3 = 200 + innerRadius * Math.cos(endR);
                const y3 = 200 + innerRadius * Math.sin(endR);
                const x4 = 200 + innerRadius * Math.cos(startR);
                const y4 = 200 + innerRadius * Math.sin(startR);
                const midA = (startR + endR) / 2;
                const labelR = (radius + innerRadius) / 2;
                const labelX = 200 + labelR * Math.cos(midA);
                const labelY = 200 + labelR * Math.sin(midA);
                const arcSpan = endA - startA;
                const showLabel = arcSpan > 15;

                return (
                  <g key={t.id}>
                    <path
                      d={`M 200 200 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`}
                      fill={t.color}
                      opacity={t.completed ? 0.4 : 0.8}
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                      stroke={
                        t.completed
                          ? 'rgba(0,0,0,0.2)'
                          : 'rgba(255,255,255,0.3)'
                      }
                      strokeWidth="1"
                      onClick={() => setSelectedTask(t)}
                    />
                    {showLabel && (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-semibold pointer-events-none"
                        fill="#ffffff"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {t.name.length > 6
                          ? t.name.slice(0, 6) + '…'
                          : t.name}
                      </text>
                    )}
                  </g>
                );
              })}

            {(() => {
              const is12h = clockFormat === '12';
              const a = getCurrentTimeAngle(is12h);
              const r = (a * Math.PI) / 180;
              const len = 180;
              const x = 200 + len * Math.cos(r);
              const y = 200 + len * Math.sin(r);
              return (
                <g>
                  <line
                    x1="200"
                    y1="200"
                    x2={x}
                    y2={y}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <circle cx={x} cy={y} r="5" fill="#ef4444" />
                </g>
              );
            })()}

            <circle
              cx="200"
              cy="200"
              r="90"
              fill={theme === 'dark' ? '#1f2937' : '#ffffff'}
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
              strokeWidth="2"
            />
            <text
              x="200"
              y="190"
              textAnchor="middle"
              className="text-2xl font-bold"
              fill={theme === 'dark' ? '#ffffff' : '#1f2937'}
            >
              {formatTime(currentTime, is12)}
            </text>
            <text
              x="200"
              y="210"
              textAnchor="middle"
              className="text-xs"
              fill={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            >
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          </svg>

          <button
            onClick={() => navigateDate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
          >
            <ChevronLeft
              size={20}
              className={theme === 'dark' ? 'text-white' : 'text-gray-700'}
            />
          </button>
          <button
            onClick={() => navigateDate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
          >
            <ChevronRight
              size={20}
              className={theme === 'dark' ? 'text-white' : 'text-gray-700'}
            />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {!currentTasks.length ? (
            <div className="text-center py-4">
              <p
                className={
                  theme === 'dark'
                    ? 'text-gray-400 text-sm'
                    : 'text-gray-500 text-sm'
                }
              >
                No tasks scheduled for this day
              </p>
            </div>
          ) : (
            currentTasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {t.name}
                  </p>
                  <p
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {clockFormat === '12'
                      ? `${formatTime12Hour(t.startTime)} – ${formatTime12Hour(
                          t.endTime
                        )}`
                      : `${t.startTime} – ${t.endTime}`}{' '}
                    · {Math.floor(t.duration / 60)}h {t.duration % 60}m
                  </p>
                </div>
                {t.completed && (
                  <CheckCircle
                    size={16}
                    className={
                      theme === 'dark'
                        ? 'text-green-400 flex-shrink-0'
                        : 'text-green-500 flex-shrink-0'
                    }
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const ArcClockView = () => {
    const is12 = clockFormat === '12';
    const hours = is12 ? 12 : 24;
    const hourAngle = is12 ? 30 : 15;  

    return (
      <div
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-3xl shadow-2xl p-4 md:p-6 border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {is12 ? '12-Hour' : '24-Hour'} Schedule
          </h3>
          <div
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              theme === 'dark'
                ? 'bg-gray-700 text-white'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {currentTasks.length} tasks
          </div>
        </div>

        <div className="relative w-full aspect-square max-w-sm max-h-64 mx-auto">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle
              cx="200"
              cy="200"
              r="180"
              fill="none"
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {Array.from({ length: hours }).map((_, i) => {
              const angle = ((i * hourAngle - 90) * Math.PI) / 180;
              const x1 = 200 + 170 * Math.cos(angle);
              const y1 = 200 + 170 * Math.sin(angle);
              const x2 = 200 + 180 * Math.cos(angle);
              const y2 = 200 + 180 * Math.sin(angle);

              const curH = currentTime.getHours();
              const displayH = is12 ? curH % 12 || 12 : curH;
              const isCur =
                is12 ? (i === 0 ? 12 : i) === displayH : i === curH;

              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isCur
                        ? theme === 'dark'
                          ? '#60a5fa'
                          : '#3b82f6'
                        : theme === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : '#d1d5db'
                    }
                    strokeWidth={isCur ? 2 : 1}
                  />
                  <text
                    x={200 + 155 * Math.cos(angle)}
                    y={200 + 155 * Math.sin(angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-semibold"
                    fill={
                      isCur
                        ? theme === 'dark'
                          ? '#60a5fa'
                          : '#3b82f6'
                        : theme === 'dark'
                        ? 'rgba(255,255,255,0.6)'
                        : '#6b7280'
                    }
                  >
                    {is12 ? (i === 0 ? 12 : i) : i}
                  </text>
                </g>
              );
            })}

            {currentTasks
              .filter((t) => showCompleted || !t.completed)
              .map((t) => {
                const startA = timeToAngle(t.startTime, is12);
                let endA = timeToAngle(t.endTime, is12);
                if (endA <= startA) endA += 360;
                const startR = (startA * Math.PI) / 180;
                const endR = (endA * Math.PI) / 180;
                const span = endA - startA;
                const largeArc = span > 180 ? 1 : 0;
                const outerR = 150;
                const innerR = 130;
                const midR = (outerR + innerR) / 2;
                const x1 = 200 + outerR * Math.cos(startR);
                const y1 = 200 + outerR * Math.sin(startR);
                const x2 = 200 + outerR * Math.cos(endR);
                const y2 = 200 + outerR * Math.sin(endR);
                const x3 = 200 + innerR * Math.cos(endR);
                const y3 = 200 + innerR * Math.sin(endR);
                const x4 = 200 + innerR * Math.cos(startR);
                const y4 = 200 + innerR * Math.sin(startR);
                const midA = (startR + endR) / 2;
                const labelX = 200 + midR * Math.cos(midA);
                const labelY = 200 + midR * Math.sin(midA);
                const showLabel = span > 20;

                return (
                  <g key={t.id}>
                    <path
                      d={`M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`}
                      fill={t.color}
                      opacity={t.completed ? 0.4 : 0.7}
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                      stroke={t.completed ? 'rgba(0,0,0,0.2)' : 'none'}
                      strokeWidth="1"
                      onClick={() => setSelectedTask(t)}
                    />
                    {showLabel && (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-semibold pointer-events-none"
                        fill="#ffffff"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {t.name.length > 8
                          ? t.name.slice(0, 8) + '…'
                          : t.name}
                      </text>
                    )}
                  </g>
                );
              })}

            {(() => {
              const is12h = clockFormat === '12';
              const a = getCurrentTimeAngle(is12h);
              const r = (a * Math.PI) / 180;
              const len = 150;
              const x = 200 + len * Math.cos(r);
              const y = 200 + len * Math.sin(r);
              return (
                <g>
                  <line
                    x1="200"
                    y1="200"
                    x2={x}
                    y2={y}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <circle cx={x} cy={y} r="5" fill="#ef4444" />
                  <line
                    x1={x}
                    y1={y}
                    x2={200 + 120 * Math.cos(r)}
                    y2={200 + 120 * Math.sin(r)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                </g>
              );
            })()}

            <circle
              cx="200"
              cy="200"
              r="100"
              fill={theme === 'dark' ? '#1f2937' : '#ffffff'}
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
              strokeWidth="2"
            />
            <text
              x="200"
              y="190"
              textAnchor="middle"
              className="text-2xl font-bold"
              fill={theme === 'dark' ? '#ffffff' : '#1f2937'}
            >
              {formatTime(currentTime, is12)}
            </text>
            <text
              x="200"
              y="210"
              textAnchor="middle"
              className="text-xs"
              fill={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            >
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          </svg>

          <button
            onClick={() => navigateDate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
          >
            <ChevronLeft
              size={20}
              className={theme === 'dark' ? 'text-white' : 'text-gray-700'}
            />
          </button>
          <button
            onClick={() => navigateDate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
          >
            <ChevronRight
              size={20}
              className={theme === 'dark' ? 'text-white' : 'text-gray-700'}
            />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {!currentTasks.length ? (
            <div className="text-center py-4">
              <p
                className={
                  theme === 'dark'
                    ? 'text-gray-400 text-sm'
                    : 'text-gray-500 text-sm'
                }
              >
                No tasks scheduled for this day
              </p>
            </div>
          ) : (
            currentTasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {t.name}
                  </p>
                  <p
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {clockFormat === '12'
                      ? `${formatTime12Hour(t.startTime)} – ${formatTime12Hour(
                          t.endTime
                        )}`
                      : `${t.startTime} – ${t.endTime}`}{' '}
                    · {Math.floor(t.duration / 60)}h {t.duration % 60}m
                  </p>
                </div>
                {t.completed && (
                  <CheckCircle
                    size={16}
                    className={
                      theme === 'dark'
                        ? 'text-green-400 flex-shrink-0'
                        : 'text-green-500 flex-shrink-0'
                    }
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const MonthlyCalendarView = () => {
    const days = getCalendarMonth();
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];  

    return (
      <div
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-3xl shadow-2xl p-6 border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setMonth(d.getMonth() - 1);
                setSelectedDate(d);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft
                size={20}
                className={theme === 'dark' ? 'text-white' : 'text-gray-700'}
              />
            </button>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setMonth(d.getMonth() + 1);
                setSelectedDate(d);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight
                size={20}
                className={theme === 'dark' ? 'text-white' : 'text-gray-700'}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-semibold text-center">
          {weekDays.map((d) => (
            <div
              key={d}
              className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 text-sm">
          {days.map(({ date, isCurrentMonth }) => {
            const ds = toDateStr(date);
            const { hasTasks, completed, total } = getDayTaskStatus(date);
            const isToday = ds === toDateStr(new Date());
            const isSelected = ds === toDateStr(selectedDate);

            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(new Date(date))}
                className={`relative p-2 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : theme === 'dark'
                    ? 'border-gray-700 hover:border-gray-500'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {isToday && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
                      Today
                    </span>
                  )}
                </div>
                {hasTasks && (
                  <div className="mt-1 flex items-center gap-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(completed / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {completed}/{total}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const HabitForm = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [frequencyType, setFrequencyType] = useState('daily');
    const [targetCount, setTargetCount] = useState(1);
    const [color, setColor] = useState(colorPalette[3] || '#10b981');
    const [icon, setIcon] = useState('🎯');
    const [reminderTime, setReminderTime] = useState('');  

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      onSave({
        id: Date.now(),
        name: name.trim(),
        description: '',
        color,
        icon,
        frequencyType,
        targetCount: Number(targetCount) || 1,
        reminderTime: reminderTime || null,
        completions: {},
      });
    };

    return (
      <div
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl shadow-xl p-4 border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          New Habit
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              className={`block text-sm mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Name
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Drink water, Read, Workout..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={`block text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Frequency
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                value={frequencyType}
                onChange={(e) => setFrequencyType(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Per week</option>
                <option value="monthly">Per month</option>
              </select>
            </div>
            <div>
              <label
                className={`block text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Target
              </label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={`block text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Color
              </label>
              <div className="flex flex-wrap gap-1">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 ${
                      color === c ? 'border-gray-900 scale-110' : 'border-gray-300'
                    } transition-transform`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label
                className={`block text-sm mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Icon
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              >
                {iconOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              className={`block text-sm mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Reminder (optional)
            </label>
            <input
              type="time"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              value={reminderTime || ''}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 rounded-lg text-sm border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  };

  const HabitDashboard = () => {
    const days = getLastNDays(30);
    const todayStr = toDateStr(new Date());  

    if (!habits.length) {
      return (
        <div
          className={`mt-4 text-center text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          No habits yet. Tap the + button to add your first habit.
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        {habits.map((habit) => {
          const { periodTotal, target, ratio } = getHabitProgress(habit);
          return (
            <div
              key={habit.id}
              className={`${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl shadow-xl p-4 border ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: habit.color }}
                  >
                    {habit.icon}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {habit.name}
                    </div>
                    <div
                      className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {habit.frequencyType === 'daily' &&
                        `Goal: ${target} / day (last 7 days)`}
                      {habit.frequencyType === 'weekly' &&
                        `Goal: ${target} / week`}
                      {habit.frequencyType === 'monthly' &&
                        `Goal: ${target} / month`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {periodTotal}/{target}
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${ratio * 100}%`,
                        backgroundColor: habit.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-1 mt-2">
                {days.map((d) => {
                  const ds = toDateStr(d);
                  const done = (habit.completions || {})[ds] > 0;
                  const isToday = ds === todayStr;
                  return (
                    <button
                      key={ds}
                      type="button"
                      onClick={() => toggleHabitCompletion(habit.id, d)}
                      className={`w-4 h-4 rounded-sm border ${
                        done
                          ? 'border-transparent'
                          : theme === 'dark'
                          ? 'border-gray-700'
                          : 'border-gray-300'
                      } ${isToday ? 'ring-1 ring-blue-500' : ''}`}
                      style={{
                        backgroundColor: done ? habit.color : 'transparent',
                      }}
                      title={ds}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const StatsView = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => h.completions && Object.keys(h.completions).length > 0).length;
    
    const todayTasks = getTasksForDate(new Date());
    const todayCompleted = todayTasks.filter(t => t.completed).length;
    const todayTotal = todayTasks.length;
    const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    return (
      <div
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-3xl shadow-2xl p-6 border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <h2
          className={`text-2xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          Statistics
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {totalTasks}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Tasks
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              {completionRate}%
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Completion Rate
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              {totalHabits}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Habits
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
              {todayRate}%
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Today
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Task Categories
            </h3>
            <div className="space-y-2">
              {categories.map(category => {
                const count = tasks.filter(t => t.category === category).length;
                const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {category}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ------------ main UI ------------

  return (
    <div
      className={
        theme === 'dark'
          ? 'bg-gray-900 text-white min-h-screen'
          : 'bg-gray-100 text-gray-900 min-h-screen'
      }
      style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}
    >
      <div className="max-w-5xl mx-auto p-4 md:p-6 overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold">
              24
            </div>
            <div>
              <h1 className="text-lg font-bold">Task & Habit Clock</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Visualize your day and build streaks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
              }
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setShowCustomization((v) => !v)}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* date + active task */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className={
                theme === 'dark'
                  ? 'text-sm text-gray-300'
                  : 'text-sm text-gray-600'
              }
            >
              {formatDate(selectedDate)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => navigateDate(-1)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={goToToday}
                className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500 text-white"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate(1)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {displayedTask ? (
            <div
              className={`px-3 py-2 rounded-2xl text-xs md:text-sm ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-semibold">{displayedTask.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <span>
                  {clockFormat === '12'
                    ? `${formatTime12Hour(
                        displayedTask.startTime
                      )} – ${formatTime12Hour(displayedTask.endTime)}`
                    : `${displayedTask.startTime} – ${displayedTask.endTime}`}
                </span>
                <span>· {Math.max(0, Math.round(taskProgress))}%</span>
                <span>· {remainingMinutes}m left</span>
              </div>
              <div className="mt-1 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${Math.max(0, Math.round(taskProgress))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              className={
                theme === 'dark'
                  ? 'text-xs text-gray-500'
                  : 'text-xs text-gray-400'
              }
            >
              No active task
            </div>
          )}
        </div>

        {/* view mode buttons */}
        <div className="mb-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setViewMode('clock')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 whitespace-nowrap ${
                viewMode === 'clock'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Clock size={14} />
              Clock
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 whitespace-nowrap ${
                viewMode === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <CalendarIcon size={14} />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('habits')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 whitespace-nowrap ${
                viewMode === 'habits'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Grid size={14} />
              Habits
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 whitespace-nowrap ${
                viewMode === 'stats'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Activity size={14} />
              Stats
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold"
            >
              <Plus size={14} />
              Add Task
            </button>
          </div>
        </div>

        {/* customization panel minimal */}
        {showCustomization && (
          <div
            className={`mb-4 rounded-2xl p-4 border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Minimal customization panel. You can extend this with clock style
              and format toggles.
            </p>
          </div>
        )}

        {/* search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks"
              className={
                theme === 'dark'
                  ? 'w-full pl-9 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }
            />
          </div>
        </div>

        {/* new task form */}
        {showAddTask && (
          <div className="mb-4">
            <div
              className={
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700 rounded-2xl p-4'
                  : 'bg-white border border-gray-200 rounded-2xl p-4'
              }
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={
                    theme === 'dark'
                      ? 'text-white font-semibold'
                      : 'text-gray-900 font-semibold'
                  }
                >
                  New Task
                </h3>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskName('');
                    setNewTaskStart('');
                    setNewTaskEnd('');
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={submitNewTask} className="space-y-3">
                <input
                  type="text"
                  placeholder="Task name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Start</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                      value={newTaskStart}
                      onChange={(e) => setNewTaskStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">End</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                      value={newTaskEnd}
                      onChange={(e) => setNewTaskEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTaskName('');
                      setNewTaskStart('');
                      setNewTaskEnd('');
                    }}
                    className="px-3 py-2 rounded-lg text-sm border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* main layout */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            {viewMode === 'clock' &&
              (clockStyle === 'arc' ? <ArcClockView /> : <PieChartClockView />)}

            {viewMode === 'calendar' && <MonthlyCalendarView />}

            {viewMode === 'habits' && (
              <div>
                <div className="mb-2 space-y-3">
                  <h2
                    className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Habits
                  </h2>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowAddHabit(true)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold"
                    >
                      <Plus size={14} />
                      Add Habit
                    </button>
                  </div>
                </div>

                {showAddHabit && (
                  <div className="mb-4">
                    <HabitForm
                      onSave={(habit) => {
                        setHabits((prev) => [...prev, habit]);
                        setShowAddHabit(false);
                      }}
                      onCancel={() => setShowAddHabit(false)}
                    />
                  </div>
                )}

                <HabitDashboard />
              </div>
            )}

            {viewMode === 'stats' && <StatsView />}
          </div>

          <div className="space-y-4">
            <WidgetDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTracker;
