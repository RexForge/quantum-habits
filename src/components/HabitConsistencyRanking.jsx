import React from 'react';
import { Award } from 'lucide-react';

const HabitConsistencyRanking = ({ habits, theme }) => {
  // Calculate consistency for each habit
  const habitsWithStats = habits.map(h => {
    const completions = h.completions || {};
    const entries = Object.entries(completions);
    const completed = entries.filter(([_, v]) => v).length;
    const daysTracked = entries.length;
    
    // Consistency score: how many days in a row you've kept the streak alive
    let currentStreak = 0;
    let maxStreak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toDateString();
      
      if (completions[dStr]) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (i > 0) {
        currentStreak = 0;
      }
    }
    
    const consistencyScore = daysTracked > 0 ? Math.round((completed / daysTracked) * 100) : 0;
    
    return {
      ...h,
      completed,
      daysTracked,
      consistencyScore,
      currentStreak,
      maxStreak
    };
  }).sort((a, b) => b.consistencyScore - a.consistencyScore);

  // Get medals
  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  const getConsistencyLabel = (score) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs work';
  };

  const getConsistencyColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-gray-800/40' : 'bg-white/80'}`}>
      <div className="flex items-center gap-3 mb-6">
        <Award size={18} className="text-yellow-500 opacity-70" />
        <h3 className="font-semibold text-sm">Consistency ranking</h3>
      </div>

      <div className="space-y-3">
        {habitsWithStats.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-4">No habits to rank</p>
        ) : (
          habitsWithStats.map((habit, idx) => (
            <div
              key={habit.id}
              className={`p-4 rounded-2xl ${
                theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50/50'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-xl">{getMedal(idx) || `#${idx + 1}`}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: habit.color || '#3b82f6' }}
                    >
                      {habit.icon}
                    </div>
                    <h4 className="font-semibold text-sm truncate">{habit.name}</h4>
                  </div>
                  <p className={`text-xs font-medium ${getConsistencyColor(habit.consistencyScore)}`}>
                    {getConsistencyLabel(habit.consistencyScore)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {habit.consistencyScore}%
                  </div>
                  <div className="text-[10px] opacity-50">
                    {habit.completed}/{habit.daysTracked}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-gray-300/50 dark:bg-gray-600/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    habit.consistencyScore >= 90
                      ? 'bg-green-500'
                      : habit.consistencyScore >= 75
                      ? 'bg-blue-500'
                      : habit.consistencyScore >= 60
                      ? 'bg-yellow-500'
                      : habit.consistencyScore >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${habit.consistencyScore}%` }}
                />
              </div>

              {/* Streak info */}
              {habit.currentStreak > 0 && (
                <div className="mt-2 text-xs opacity-60">
                  🔥 {habit.currentStreak}-day streak (best: {habit.maxStreak})
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200/10">
        <p className="text-xs opacity-50">
          Consistency = completed days / tracked days × 100
        </p>
      </div>
    </div>
  );
};

export default HabitConsistencyRanking;
