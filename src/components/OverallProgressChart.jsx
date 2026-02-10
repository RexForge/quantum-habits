import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

const OverallProgressChart = ({ habits, theme }) => {
  const [view, setView] = useState('streaks'); // 'streaks' or 'momentum'

  // Calculate streak for each habit
  const habitsWithStreaks = habits.map(h => {
    let streak = 0;
    let curr = new Date();
    const completions = h.completions || {};
    
    while (true) {
      const dStr = curr.toDateString();
      if (completions[dStr]) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    
    return { ...h, streak };
  }).sort((a, b) => b.streak - a.streak);

  // Calculate momentum (total completions per day for last 30 days)
  const momentumData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toDateString();
    let completions = 0;
    
    habits.forEach(h => {
      if (h.completions?.[dStr]) {
        completions++;
      }
    });
    
    momentumData.push({
      date: d,
      dateStr: dStr,
      completions,
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate()
    });
  }

  const maxMomentum = Math.max(...momentumData.map(d => d.completions), 1);
  const maxStreak = Math.max(...habitsWithStreaks.map(h => h.streak), 1);
  const avgMomentum = Math.round(momentumData.reduce((a, b) => a + b.completions, 0) / momentumData.length);

  return (
    <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-gray-800/40' : 'bg-white/80'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={18} className="text-blue-500 opacity-70" />
          <h3 className="font-semibold text-sm">Overall progress</h3>
        </div>
        
        <div className="flex gap-2">
          {[
            { label: 'Streaks', value: 'streaks' },
            { label: 'Momentum', value: 'momentum' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                view === opt.value
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

      {view === 'streaks' && (
        <div className="space-y-3">
          {habitsWithStreaks.length === 0 ? (
            <p className="text-sm opacity-50 text-center py-6">No habits yet</p>
          ) : (
            habitsWithStreaks.map((habit, idx) => {
              const barWidth = (habit.streak / maxStreak) * 100;
              
              return (
                <div key={habit.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                        style={{ backgroundColor: habit.color || '#3b82f6' }}
                      >
                        {habit.icon}
                      </div>
                      <span className="text-sm font-medium truncate">{habit.name}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {habit.streak} days
                    </span>
                  </div>
                  
                  <div className="w-full h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(barWidth, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'momentum' && (
        <div>
          {/* Line chart showing daily completion count */}
          <div className="flex items-end justify-between gap-1 h-40 mb-4 pb-4 border-b border-gray-200/10">
            {momentumData.map((day, idx) => {
              const barHeight = (day.completions / maxMomentum) * 100;
              const isToday = idx === momentumData.length - 1;
              
              return (
                <div
                  key={day.dateStr}
                  className="flex flex-col items-center flex-1 group cursor-pointer"
                  title={`${day.dateStr}: ${day.completions}/${habits.length}`}
                >
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className={`w-full transition-all rounded-t-sm ${
                        barHeight === 0
                          ? 'h-0.5 bg-gray-300/40'
                          : `${
                              day.completions === habits.length
                                ? 'bg-green-500'
                                : day.completions >= habits.length * 0.7
                                ? 'bg-blue-500'
                                : day.completions >= habits.length * 0.4
                                ? 'bg-yellow-500'
                                : 'bg-orange-400'
                            }`
                      }`}
                      style={{ height: `${Math.max(barHeight, 2)}%` }}
                    />
                  </div>

                  {/* Labels: show every 5 days or if today */}
                  {(idx % 5 === 0 || isToday) && (
                    <span className="text-[9px] font-bold opacity-40 mt-2">
                      {idx === momentumData.length - 1 ? 'Today' : day.dayNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs opacity-60 mb-1">Average/day</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {avgMomentum}/{habits.length}
              </div>
              <div className="text-[10px] opacity-50">habits</div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-60 mb-1">Best day</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {Math.max(...momentumData.map(d => d.completions))}/{habits.length}
              </div>
              <div className="text-[10px] opacity-50">all done</div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-60 mb-1">Perfect days</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {momentumData.filter(d => d.completions === habits.length).length}
              </div>
              <div className="text-[10px] opacity-50">30-day streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {view === 'momentum' && (
        <div className="mt-4 pt-4 border-t border-gray-200/10">
          <p className="text-xs opacity-50 mb-3">Completion color scale:</p>
          <div className="flex gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span className="opacity-60">100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span className="opacity-60">70%+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
              <span className="opacity-60">40%+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-orange-400 rounded-sm" />
              <span className="opacity-60">&lt;40%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallProgressChart;
