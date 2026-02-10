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
          <div className="relative h-32 mb-6 pb-6 border-b border-gray-200/10">
            <svg className="w-full h-full" viewBox="0 0 700 120" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((line) => (
                <line
                  key={`grid-${line}`}
                  x1="0"
                  y1={120 - line * 120}
                  x2="700"
                  y2={120 - line * 120}
                  stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
                  strokeDasharray="4"
                  opacity="0.3"
                />
              ))}

              {/* Line path */}
              <polyline
                points={momentumData
                  .map((day, idx) => {
                    const x = (idx / (momentumData.length - 1)) * 700;
                    const y = 120 - (day.completions / maxMomentum) * 120;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {momentumData.map((day, idx) => {
                const x = (idx / (momentumData.length - 1)) * 700;
                const y = 120 - (day.completions / maxMomentum) * 120;
                const isToday = idx === momentumData.length - 1;

                return (
                  <g key={day.dateStr}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isToday ? '5' : '3'}
                      fill={
                        day.completions === habits.length
                          ? '#10b981'
                          : day.completions >= habits.length * 0.7
                          ? '#3b82f6'
                          : day.completions >= habits.length * 0.4
                          ? '#f59e0b'
                          : '#f97316'
                      }
                      opacity={isToday ? '1' : '0.6'}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between px-2 mt-2 text-[9px] font-bold opacity-40">
              <span>{momentumData[0].dayNum}</span>
              <span>{momentumData[Math.floor(momentumData.length / 2)].dayNum}</span>
              <span>Today</span>
            </div>
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
