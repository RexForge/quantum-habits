import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getHabitStreak } from '../utils/statsHelpers';

const HabitComparison = ({ habits, theme }) => {
  // Calculate strength score for each habit (combo of streak + consistency)
  const habitsWithScores = habits.map(h => {
    const streak = getHabitStreak(h.completions);
    const totalCompletions = h.completions ? Object.values(h.completions).filter(v => v).length : 0;
    const daysTracked = h.completions ? Object.keys(h.completions).length : 0;
    const consistency = daysTracked > 0 ? Math.round((totalCompletions / daysTracked) * 100) : 0;
    
    // Strength = 70% current streak + 30% consistency
    const strength = Math.round((streak * 0.4) + (consistency * 0.6));
    
    return {
      ...h,
      streak,
      consistency,
      strength,
      totalCompletions,
      daysTracked
    };
  }).sort((a, b) => b.strength - a.strength);

  const maxStrength = Math.max(...habitsWithScores.map(h => h.strength), 1);

  return (
    <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-gray-800/40' : 'bg-white/80'}`}>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp size={18} className="text-blue-500 opacity-70" />
        <h3 className="font-semibold text-sm">Habit strength</h3>
      </div>

      <div className="space-y-4">
        {habitsWithScores.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-4">No habits tracked yet</p>
        ) : (
          habitsWithScores.map((habit, idx) => {
            const barWidth = (habit.strength / maxStrength) * 100;
            const isTop = idx === 0;
            const isBottom = idx === habitsWithScores.length - 1;

            return (
              <div key={habit.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: habit.color || '#3b82f6' }}
                    >
                      {habit.icon}
                    </div>
                    <span className="text-sm font-semibold truncate">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-right whitespace-nowrap">
                      {habit.streak}d
                    </span>
                    <span className="text-sm font-bold text-right w-10">
                      {habit.strength}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isTop ? 'bg-green-500' : isBottom ? 'bg-orange-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="text-[10px] opacity-40 mt-1">
                  {habit.totalCompletions} completions • {habit.consistency}% consistency
                </div>
              </div>
            );
          })
        )}
      </div>

      {habitsWithScores.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200/10">
          <p className="text-xs opacity-50 mb-3">Strength = 40% streak + 60% consistency</p>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="opacity-60">Strongest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span className="opacity-60">Needs work</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitComparison;
