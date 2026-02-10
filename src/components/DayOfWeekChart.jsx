import React from 'react';
import { Calendar } from 'lucide-react';

const DayOfWeekChart = ({ habits, theme }) => {
  // Calculate completions by day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCompletions = [0, 0, 0, 0, 0, 0, 0];
  const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // total habit slots for each day

  // Look back 12 weeks to get pattern
  for (let week = 0; week < 12; week++) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const date = new Date();
      const daysBack = (week * 7) + (6 - dayOfWeek);
      date.setDate(date.getDate() - daysBack);
      const dateStr = date.toDateString();

      habits.forEach(habit => {
        dayTotals[dayOfWeek]++;
        if (habit.completions?.[dateStr]) {
          dayCompletions[dayOfWeek]++;
        }
      });
    }
  }

  const dayRates = dayTotals.map((total, idx) => 
    total > 0 ? Math.round((dayCompletions[idx] / total) * 100) : 0
  );

  const maxRate = Math.max(...dayRates, 1);
  const avgRate = Math.round(dayRates.reduce((a, b) => a + b) / 7);
  const bestDay = dayRates.indexOf(Math.max(...dayRates));
  const worstDay = dayRates.indexOf(Math.min(...dayRates));

  return (
    <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-gray-800/40' : 'bg-white/80'}`}>
      <div className="flex items-center gap-3 mb-6">
        <Calendar size={18} className="text-purple-500 opacity-70" />
        <h3 className="font-semibold text-sm">Weekly productivity</h3>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32 mb-4">
        {dayRates.map((rate, idx) => {
          const barHeight = (rate / maxRate) * 100;
          const isBest = idx === bestDay;
          const isWorst = idx === worstDay;

          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              <div
                className={`w-full rounded-t-md transition-all ${
                  isBest
                    ? 'bg-green-500'
                    : isWorst
                    ? 'bg-orange-400'
                    : 'bg-blue-400'
                }`}
                style={{ height: `${Math.max(barHeight, 8)}%` }}
              />
              <div className="text-[10px] font-bold opacity-50 mt-2 leading-tight">
                {dayNames[idx]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200/10">
        <div className="text-center">
          <div className="text-xs opacity-60">Best day</div>
          <div className="font-bold text-sm">{dayNames[bestDay]}</div>
          <div className="text-xs opacity-50">{dayRates[bestDay]}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs opacity-60">Average</div>
          <div className="font-bold text-sm">{avgRate}%</div>
          <div className="text-xs opacity-50">across week</div>
        </div>
        <div className="text-center">
          <div className="text-xs opacity-60">Worst day</div>
          <div className="font-bold text-sm">{dayNames[worstDay]}</div>
          <div className="text-xs opacity-50">{dayRates[worstDay]}%</div>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs font-medium leading-relaxed">
          You're most productive on <span className="font-bold">{dayNames[bestDay]}s</span>
          {dayRates[bestDay] - avgRate > 5 && ` (+${dayRates[bestDay] - avgRate}% above average)`}
        </p>
      </div>
    </div>
  );
};

export default DayOfWeekChart;
