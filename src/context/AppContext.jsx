import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toDateStr, getTasksForDate, getTaskStatus, getCurrentActiveTask, getTaskProgress } from '../utils/timeHelpers';
import { setupStatusBar, vibrate } from '../utils/mobileHelpers';
import { usePersistence } from '../hooks/usePersistence';
import { useViewport } from '../hooks/useViewport';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
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

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
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
  const [editingTask, setEditingTask] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState(null);
  const [habitCalendarDate, setHabitCalendarDate] = useState(new Date());

  // New task form state - using controlled inputs
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');

  // Viewport and persistence hooks
  const { paddingTop, paddingBottom, setPaddingTop, setPaddingBottom } = useViewport(
    showAddTask, showAddHabit, editingTask, editingHabit
  );

  usePersistence(tasks, habits, theme, clockFormat, clockStyle);

  // Current time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  // Status bar configuration
  useEffect(() => {
    setupStatusBar(theme, setPaddingTop, setPaddingBottom);
  }, [theme, setPaddingTop, setPaddingBottom]);

  // ------------ filtering + current task ------------
  const filteredTasks = useMemo(() => {
    let list = getTasksForDate(tasks, selectedDate);
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

  const activeTask = getCurrentActiveTask(filteredTasks, currentTime);
  const displayedTask = activeTask || (filteredTasks.length ? filteredTasks[currentTaskIndex] : null);
  const taskProgress = getTaskProgress(displayedTask, currentTime);

  // ------------ CRUD ------------
  const addTask = useCallback((data) => {
    const newTask = {
      id: Date.now(),
      name: data.name,
      description: data.description || '',
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      color: data.color || '#10b981',
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
    vibrate();
  }, [selectedDate]);

  const toggleTaskComplete = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    vibrate();
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const editTask = useCallback((id, data) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              name: data.name,
              description: data.description || '',
              startTime: data.startTime,
              endTime: data.endTime,
              duration: data.duration,
              color: data.color || t.color,
              icon: data.icon || t.icon,
              date: data.date || t.date,
              recurring: data.recurring || t.recurring,
              reminder: data.reminder || t.reminder,
              priority: data.priority || t.priority,
              category: data.category || t.category,
              notes: data.notes || t.notes,
              photos: data.photos || t.photos,
              location: data.location || t.location,
            }
          : t
      )
    );
    vibrate();
  }, []);

  const editHabit = useCallback((id, data) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              name: data.name,
              description: data.description || '',
              color: data.color || h.color,
              icon: data.icon || h.icon,
              frequencyType: data.frequencyType || h.frequencyType,
              targetCount: data.targetCount || h.targetCount,
              reminderTime: data.reminderTime || h.reminderTime,
            }
          : h
      )
    );
    vibrate();
  }, []);

  const navigateTask = useCallback((dir) => {
    if (!filteredTasks.length) return;
    setCurrentTaskIndex((prev) => {
      const idx = prev + dir;
      if (idx < 0) return filteredTasks.length - 1;
      if (idx >= filteredTasks.length) return 0;
      return idx;
    });
  }, [filteredTasks.length]);

  const navigateDate = useCallback((dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  }, [selectedDate]);

  const goToToday = useCallback(() => setSelectedDate(new Date()), []);

  // ------------ bulk operations ------------
  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const selectAllTasks = useCallback(() => {
    const allIds = filteredTasks.map(t => t.id);
    setSelectedTasks(new Set(allIds));
  }, [filteredTasks]);

  const clearTaskSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  const bulkCompleteTasks = useCallback(() => {
    selectedTasks.forEach(id => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: true } : t))
      );
    });
    setSelectedTasks(new Set());
    vibrate();
  }, [selectedTasks]);

  const bulkDeleteTasks = useCallback(() => {
    if (window.confirm(`Delete ${selectedTasks.size} selected tasks?`)) {
      setTasks((prev) => prev.filter((t) => !selectedTasks.has(t.id)));
      setSelectedTasks(new Set());
      vibrate();
    }
  }, [selectedTasks]);

  // ------------ habit operations ------------

  const toggleHabitCompletion = useCallback((habitId, date) => {
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
    vibrate();
  }, []);

  const deleteHabit = useCallback((habitId) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    vibrate();
  }, []);

  const triggerHaptic = useCallback((style = 'light') => {
    vibrate(style);
  }, []);

  const contextValue = {
    // State
    tasks,
    habits,
    selectedDate,
    currentTime,
    theme,
    paddingTop,
    paddingBottom,
    showCustomization,
    showCompleted,
    searchQuery,
    filterCategory,
    filterPriority,
    viewMode,
    currentTaskIndex,
    clockFormat,
    clockStyle,
    selectedTask,
    showAddTask,
    showAddHabit,
    editingTask,
    editingHabit,
    selectedTasks,
    selectedHabitForCalendar,
    habitCalendarDate,
    newTaskName,
    newTaskStart,
    newTaskEnd,
    filteredTasks,
    activeTask,
    displayedTask,
    taskProgress,

    // Setters
    setTasks,
    setHabits,
    setSelectedDate,
    setCurrentTime,
    setTheme,
    setShowCustomization,
    setShowCompleted,
    setSearchQuery,
    setFilterCategory,
    setFilterPriority,
    setViewMode,
    setCurrentTaskIndex,
    setClockFormat,
    setClockStyle,
    setSelectedTask,
    setShowAddTask,
    setShowAddHabit,
    setEditingTask,
    setEditingHabit,
    setSelectedTasks,
    setSelectedHabitForCalendar,
    setHabitCalendarDate,
    setNewTaskName,
    setNewTaskStart,
    setNewTaskEnd,

    // Actions
    addTask,
    toggleTaskComplete,
    deleteTask,
    editTask,
    editHabit,
    navigateTask,
    navigateDate,
    goToToday,
    toggleTaskSelection,
    selectAllTasks,
    clearTaskSelection,
    bulkCompleteTasks,
    bulkDeleteTasks,
    toggleHabitCompletion,
    deleteHabit,
    triggerHaptic,
    toggleTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
