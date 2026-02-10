import { toDateStr } from './timeHelpers';

/**
 * Calculate the current streak for a habit (consecutive days completed from today going back)
 */
export const getHabitStreak = (completions) => {
  if (!completions) return 0;
  let count = 0;
  let curr = new Date();
  while (true) {
    const dStr = toDateStr(curr);
    if (completions[dStr]) {
      count++;
      curr.setDate(curr.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
};

/**
 * Calculate the longest streak ever achieved (not just current)
 */
export const getHabitLongestStreak = (completions) => {
  if (!completions || Object.keys(completions).length === 0) return 0;
  
  const dates = Object.keys(completions)
    .filter(d => completions[d] === 1)
    .sort()
    .map(d => new Date(d));
  
  if (dates.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffTime = currDate - prevDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
};

/**
 * Get completion data for last N days (for heatmaps)
 */
export const getCompletionDaysData = (completions, days = 7) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = toDateStr(d);
    data.push({
      date: d,
      dateStr: dStr,
      completed: completions?.[dStr] === 1 ? 1 : 0,
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }
  return data;
};

/**
 * Calculate completion rate over a period
 */
export const getCompletionRate = (completions, days = 7) => {
  if (!completions) return 0;
  
  const data = getCompletionDaysData(completions, days);
  const completed = data.filter(d => d.completed).length;
  
  return {
    completed,
    total: days,
    percentage: Math.round((completed / days) * 100)
  };
};

/**
 * Get completion count for all habits
 */
export const getAllHabitsCompletions = (habits, dateStr = null) => {
  if (!dateStr) {
    dateStr = toDateStr(new Date());
  }
  
  return habits.filter(h => h.completions?.[dateStr] === 1).length;
};

/**
 * Calculate stats for a period (today, this week, all-time)
 */
export const getHabitStats = (habits) => {
  const today = new Date();
  const todayStr = toDateStr(today);
  
  // This week (last 7 days)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6); // Include today + 6 previous days
  
  // Calculate all metrics
  const allStreaks = habits.map(h => getHabitStreak(h.completions));
  const currentStreak = Math.max(0, ...allStreaks);
  
  // Today: count habits completed
  const completedToday = getAllHabitsCompletions(habits, todayStr);
  const totalHabits = habits.length;
  
  // This week: average completion rate
  let weekCompletions = 0;
  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = toDateStr(d);
    weekTotal += habits.length;
    habits.forEach(h => {
      if (h.completions?.[dStr] === 1) {
        weekCompletions++;
      }
    });
  }
  const weekCompletionRate = weekTotal > 0 ? Math.round((weekCompletions / weekTotal) * 100) : 0;
  
  // All-time completions (across all habits)
  let allTimeCompletions = 0;
  habits.forEach(h => {
    if (h.completions) {
      allTimeCompletions += Object.values(h.completions).filter(v => v === 1).length;
    }
  });
  
  // Best streak across all habits
  const allBestStreak = Math.max(0, ...habits.map(h => getHabitLongestStreak(h.completions)));
  
  return {
    // Current metrics
    currentStreak,
    completedToday,
    totalHabits,
    todayPercentage: totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0,
    
    // Weekly metrics
    weekCompletions,
    weekCompletionRate,
    
    // All-time metrics
    allTimeCompletions,
    bestStreak: allBestStreak,
  };
};

/**
 * Get daily completion data for trend chart (all habits combined)
 */
export const getTrendData = (habits, days = 7) => {
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = toDateStr(d);
    
    let completed = 0;
    let total = habits.length;
    
    habits.forEach(h => {
      if (h.completions?.[dStr] === 1) {
        completed++;
      }
    });
    
    data.push({
      date: d,
      dateStr: dStr,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }
  
  return data;
};

/**
 * Get intensity level (0-3) for heatmap visualization
 */
export const getIntensityLevel = (completed, total) => {
  if (total === 0) return 0;
  const percentage = (completed / total) * 100;
  if (percentage === 0) return 0;
  if (percentage < 50) return 1;
  if (percentage < 100) return 2;
  return 3;
};
