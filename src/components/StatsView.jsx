import React, { useMemo, useState } from 'react';
import { Flame, CheckCircle } from 'lucide-react';
import { getHabitStats } from '../utils/statsHelpers';
import TrendChart from './TrendChart';
import HabitStatCard from './HabitStatCard';
import HabitComparison from './HabitComparison';
import DayOfWeekChart from './DayOfWeekChart';
import HabitConsistencyRanking from './HabitConsistencyRanking';

const StatsView = ({ habits = [], theme = 'light' } = {}) => {
  const [period, setPeriod] = useState('week'); // 'week' or 'alltime'

  const stats = useMemo(() => {
    return getHabitStats(habits);
  }, [habits]);

  // Determine hero stat based on selected period
  const getHeroStat = () => {
    if (period === 'week') {
      return {
        label: 'This week',
        value: `${stats.weekCompletionRate}%`,
        subtext: `${stats.weekCompletions} check-ins`
      };
    } else {
      return {
        label: 'Current streak',
        value: `${stats.currentStreak}`,
        subtext: `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''} in a row`
      };
    }
  };

  const heroStat = getHeroStat();
  const sortedHabits = [...habits].sort((a, b) => {
    // Sort by current streak descending
    const streakA = a.completions ? Object.values(a.completions).filter(v => v === 1).length : 0;
    const streakB = b.completions ? Object.values(b.completions).filter(v => v === 1).length : 0;
    return streakB - streakA;
  });

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* --- SECTION 1: Title + Period Selector --- */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Insights</h2>

        <div className="flex gap-2">
          {[
            { label: 'Week', value: 'week' },
            { label: 'All time', value: 'alltime' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === opt.value
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700/50 text-gray-400'
                    : 'bg-gray-100/80 text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- SECTION 2: Hero Stat --- */}
      <div className={`p-8 rounded-3xl ${
        theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
      } border border-gray-200/20`}>
        <p className="text-xs font-semibold opacity-50 mb-3 uppercase tracking-wide">{heroStat.label}</p>
        <div className="flex items-end gap-2">
          <h1 className="text-5xl font-black text-blue-600 dark:text-blue-400">
            {heroStat.value}
          </h1>
          {period === 'alltime' && stats.currentStreak > 0 && (
            <span className="text-2xl mb-2">🔥</span>
          )}
        </div>
        <p className="text-sm opacity-60 mt-3">{heroStat.subtext}</p>
      </div>

      {/* --- SECTION 3: Overview Card --- */}
      <div className={`p-6 rounded-3xl ${
        theme === 'dark' ? 'bg-gray-800/40' : 'bg-white/80'
      }`}>
        <h3 className="font-semibold text-xs opacity-50 mb-5 uppercase tracking-widest">Overview</h3>

        <div className="space-y-4">
          {/* Row 1: Today */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={16} className="text-green-500 opacity-80" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <span className="text-sm font-bold">
              {stats.completedToday}/{stats.totalHabits} ({stats.todayPercentage}%)
            </span>
          </div>

          {/* Row 2: This week */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium">This week</span>
            <span className="text-sm font-bold">
              {stats.weekCompletionRate}% • {stats.weekCompletions} check-ins
            </span>
          </div>

          {/* Row 3: Best streak & all-time */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Flame size={16} className="text-orange-500 opacity-80" fill="currentColor" />
              <span className="text-sm font-medium">Best streak</span>
            </div>
            <span className="text-sm font-bold">
              {stats.bestStreak} days • {stats.allTimeCompletions} all-time
            </span>
          </div>
        </div>
      </div>

      {/* --- SECTION 4: Habit Strength Ranking --- */}
      {habits.length > 0 && <HabitComparison habits={habits} theme={theme} />}

      {/* --- SECTION 5: Productivity by Day of Week --- */}
      {habits.length > 0 && <DayOfWeekChart habits={habits} theme={theme} />}

      {/* --- SECTION 6: Consistency Ranking --- */}
      {habits.length > 0 && <HabitConsistencyRanking habits={habits} theme={theme} />}

      {/* --- SECTION 7: Detailed Trend --- */}
      {habits.length > 0 && <TrendChart habits={habits} theme={theme} />}

      {/* --- SECTION 8: Individual Habit Details --- */}
      {sortedHabits.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold opacity-50 mb-4 uppercase tracking-widest">
            Habit details ({sortedHabits.length})
          </h3>
          <div className="space-y-3">
            {sortedHabits.map(habit => (
              <HabitStatCard
                key={habit.id}
                habit={habit}
                theme={theme}
                onSelect={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="text-center py-12 opacity-40">
          <p className="font-medium">No habits yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default StatsView;
