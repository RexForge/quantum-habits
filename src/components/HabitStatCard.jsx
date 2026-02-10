import React from 'react';
import { Flame } from 'lucide-react';
import { getHabitStreak, getCompletionRate, getCompletionDaysData } from '../utils/statsHelpers';

const HabitStatCard = ({ habit, theme, onSelect }) => {
  const streak = getHabitStreak(habit.completions);
  const weeklyData = getCompletionRate(habit.completions, 7);
  const sevenDayHistory = getCompletionDaysData(habit.completions, 7);

  const getSquareColor = (completed) => {
    if (completed) {
      return 'bg-blue-500';
    }
    return theme === 'dark' ? 'bg-gray-700/60' : 'bg-gray-200/60';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-2xl transition-all cursor-pointer ${
        theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
      }`}
    >
      {/* Header: Icon + Name + Streak */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-base shrink-0"
            style={{ backgroundColor: habit.color || '#3b82f6' }}
          >
            {habit.icon || '★'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight truncate">{habit.name}</h4>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-xs mt-1">
                <Flame size={12} fill="currentColor" />
                {streak} day{streak !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly completion rate */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-medium opacity-60">This week</span>
          <span className="font-semibold text-xs">{weeklyData.percentage}%</span>
        </div>
        <div className="w-full h-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${weeklyData.percentage}%` }}
          />
        </div>
      </div>

      {/* 7-day heatmap */}
      <div className="flex gap-1 justify-between">
        {sevenDayHistory.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-full aspect-square rounded-md transition-all ${getSquareColor(day.completed)}`}
              title={day.dateStr}
            />
            <span className="text-[9px] font-semibold opacity-40">
              {day.dayOfWeek}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitStatCard;
