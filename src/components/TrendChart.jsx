import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { getTrendData, getIntensityLevel } from '../utils/statsHelpers';

const TrendChart = ({ habits, theme }) => {
  const [period, setPeriod] = useState('week'); // 'week' or 'month'
  
  const days = period === 'week' ? 7 : 28;
  const trendData = getTrendData(habits, days);
  
  const getHeatmapColor = (intensity) => {
    if (intensity === 0) {
      return theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/50';
    }
    if (intensity === 1) {
      return 'bg-blue-300/60';
    }
    if (intensity === 2) {
      return 'bg-blue-500/80';
    }
    return 'bg-blue-600';
  };

  return (
    <div className={`p-6 rounded-3xl ${
      theme === 'dark' ? 'bg-gray-800/40' : 'bg-white/80'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-blue-500 opacity-70" />
          <h3 className="font-semibold text-sm">Completion trend</h3>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2">
          {[
            { label: '7d', value: 'week' },
            { label: '28d', value: 'month' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
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

      {/* Heatmap Grid */}
      <div className="flex gap-1 flex-wrap justify-between">
        {trendData.map((day, idx) => {
          const intensity = getIntensityLevel(day.completed, day.total);
          
          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 flex-1"
              title={`${day.dateStr}: ${day.completed}/${day.total} (${day.percentage}%)`}
            >
              <div
                className={`w-full aspect-square rounded-md transition-all ${getHeatmapColor(intensity)}`}
              />
              <span className="text-[10px] font-semibold opacity-50">
                {day.dayOfWeek}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-between items-center mt-4 px-1">
        <span className="text-[11px] font-semibold opacity-40">LESS</span>
        <div className="flex gap-1 items-center">
          {[0, 1, 2, 3].map(level => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold opacity-40">MORE</span>
      </div>
    </div>
  );
};

export default TrendChart;
