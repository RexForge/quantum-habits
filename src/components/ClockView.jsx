import React from 'react';
import { Calendar as CalendarIcon, Clock, Plus, X, CheckCircle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatTime, formatTime12Hour, timeToAngle, getCurrentTimeAngle, getRemainingTime, getTaskStatus } from '../utils/timeHelpers';

const ClockView = () => {
  const {
    theme,
    clockFormat,
    clockStyle,
    currentTime,
    filteredTasks: currentTasks,
    selectedDate,
    displayedTask,
    taskProgress,
    selectedTasks,
    toggleTaskSelection,
    toggleTaskComplete,
    setSelectedTask,
    setEditingTask,
    deleteTask,
    navigateDate,
  } = useAppContext();

  const is12 = clockFormat === '12';
  const hours = is12 ? 12 : 24;
  const hourAngle = is12 ? 30 : 15;

  const todayTasks = currentTasks;
  const completedTasks = todayTasks.filter((t) => t.completed);
  const currentList = todayTasks.filter((t) => getTaskStatus(t, currentTime) === 'current');
  const upcoming = todayTasks.filter(
    (t) => getTaskStatus(t, currentTime) === 'upcoming' && !t.completed
  );

  if (clockStyle === 'pie') {
    return (
      <div
        className={`bg-panel rounded-3xl shadow-2xl p-4 md:p-6 border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {is12 ? '12-Hour' : '24-Hour'} Schedule
          </h3>
          <div
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              theme === 'dark'
                ? 'bg-gray-700 text-white'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {currentTasks.length} tasks
          </div>
        </div>

        <div className="relative w-full aspect-square max-w-sm max-h-64 mx-auto">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle
              cx="200"
              cy="200"
              r="180"
              fill={theme === 'dark' ? '#1f2937' : '#f9fafb'}
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
              strokeWidth="2"
            />

            {Array.from({ length: hours }).map((_, i) => {
              const angle = ((i * hourAngle - 90) * Math.PI) / 180;
              const x1 = 200 + 170 * Math.cos(angle);
              const y1 = 200 + 170 * Math.sin(angle);
              const x2 = 200 + 180 * Math.cos(angle);
              const y2 = 200 + 180 * Math.sin(angle);

              const curH = currentTime.getHours();
              const displayH = is12 ? curH % 12 || 12 : curH;
              const isCur =
                is12 ? (i === 0 ? 12 : i) === displayH : i === curH;

              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isCur
                        ? theme === 'dark'
                          ? '#60a5fa'
                          : '#3b82f6'
                        : theme === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : '#d1d5db'
                    }
                    strokeWidth={isCur ? 2 : 1}
                  />
                  <text
                    x={200 + 155 * Math.cos(angle)}
                    y={200 + 155 * Math.sin(angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-semibold"
                    fill={
                      isCur
                        ? theme === 'dark'
                          ? '#60a5fa'
                          : '#3b82f6'
                        : theme === 'dark'
                        ? 'rgba(255,255,255,0.6)'
                        : '#6b7280'
                    }
                  >
                    {is12 ? (i === 0 ? 12 : i) : i}
                  </text>
                </g>
              );
            })}

            {currentTasks
              .filter((t) => true) // showCompleted is handled in filtering
              .map((t) => {
                const startA = timeToAngle(t.startTime, is12);
                let endA = timeToAngle(t.endTime, is12);
                if (endA <= startA) endA += 360;
                const startR = (startA * Math.PI) / 180;
                const endR = (endA * Math.PI) / 180;
                const largeArc = endA - startA > 180 ? 1 : 0;
                const radius = 180;
                const innerRadius = 100;
                const x1 = 200 + radius * Math.cos(startR);
                const y1 = 200 + radius * Math.sin(startR);
                const x2 = 200 + radius * Math.cos(endR);
                const y2 = 200 + radius * Math.sin(endR);
                const x3 = 200 + innerRadius * Math.cos(endR);
                const y3 = 200 + innerRadius * Math.sin(endR);
                const x4 = 200 + innerRadius * Math.cos(startR);
                const y4 = 200 + innerRadius * Math.sin(startR);
                const midA = (startR + endR) / 2;
                const labelR = (radius + innerRadius) / 2;
                const labelX = 200 + labelR * Math.cos(midA);
                const labelY = 200 + labelR * Math.sin(midA);
                const arcSpan = endA - startA;
                const showLabel = arcSpan > 15;

                return (
                  <g key={t.id}>
                    <path
                      d={`M 200 200 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`}
                      fill={t.color}
                      opacity={t.completed ? 0.4 : 0.8}
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                      stroke={
                        t.completed
                          ? 'rgba(0,0,0,0.2)'
                          : 'rgba(255,255,255,0.3)'
                      }
                      strokeWidth="1"
                      onClick={() => setSelectedTask(t)}
                    />
                    {showLabel && (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-semibold pointer-events-none"
                        fill="#ffffff"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {t.name.length > 6
                          ? t.name.slice(0, 6) + '…'
                          : t.name}
                      </text>
                    )}
                  </g>
                );
              })}

            {(() => {
              const is12h = clockFormat === '12';
              const a = getCurrentTimeAngle(is12h);
              const r = (a * Math.PI) / 180;
              const len = 180;
              const x = 200 + len * Math.cos(r);
              const y = 200 + len * Math.sin(r);
              return (
                <g>
                  <line
                    x1="200"
                    y1="200"
                    x2={x}
                    y2={y}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <circle cx={x} cy={y} r="5" fill="#ef4444" />
                </g>
              );
            })()}

            <circle
              cx="200"
              cy="200"
              r="90"
              fill={theme === 'dark' ? '#1f2937' : '#ffffff'}
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
              strokeWidth="2"
            />
            <text
              x="200"
              y="190"
              textAnchor="middle"
              className="text-2xl font-bold"
              fill={theme === 'dark' ? '#ffffff' : '#1f2937'}
            >
              {formatTime(currentTime, is12)}
            </text>
            <text
              x="200"
              y="210"
              textAnchor="middle"
              className="text-xs"
              fill={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            >
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          </svg>

          <button
            onClick={() => navigateDate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
          >
            <ChevronLeft
              size={20}
              className={theme === 'dark' ? 'text-white' : 'text-gray-900'}
            />
          </button>
          <button
            onClick={() => navigateDate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
          >
            <ChevronRight
              size={20}
              className={theme === 'dark' ? 'text-white' : 'text-gray-900'}
            />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {!currentTasks.length ? (
            <div className="text-center py-4">
              <p
                className={
                  theme === 'dark'
                    ? 'text-gray-400 text-sm'
                    : 'text-gray-500 text-sm'
                }
              >
                No tasks scheduled for this day
              </p>
            </div>
          ) : (
            currentTasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all group ${
                  selectedTasks.has(t.id)
                    ? theme === 'dark'
                      ? 'bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-blue-50 border-2 border-blue-500'
                    : theme === 'dark'
                    ? 'bg-gray-700/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1 min-w-0" onClick={() => setSelectedTask(t)}>
                  <p
                    className={`text-sm font-semibold truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {t.name}
                  </p>
                  <p
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {clockFormat === '12'
                      ? `${formatTime12Hour(t.startTime)} – ${formatTime12Hour(
                          t.endTime
                        )}`
                      : `${t.startTime} – ${t.endTime}`}{' '}
                    · {Math.floor(t.duration / 60)}h {t.duration % 60}m
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!t.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskComplete(t.id);
                      }}
                      className="p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500"
                      title="Mark as completed"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTask(t);
                    }}
                    className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    title="Edit task"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this task?')) {
                        deleteTask(t.id);
                      }
                    }}
                    className={`p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500`}
                    title="Delete task"
                  >
                    <X size={14} />
                  </button>
                </div>
                {t.completed && (
                  <CheckCircle
                    size={16}
                    className={
                      theme === 'dark'
                        ? 'text-green-400 flex-shrink-0'
                        : 'text-green-500 flex-shrink-0'
                    }
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Arc Clock View
  return (
    <div
      className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rounded-3xl shadow-2xl p-4 md:p-6 border ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {is12 ? '12-Hour' : '24-Hour'} Schedule
        </h3>
        <div
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
            theme === 'dark'
              ? 'bg-gray-700 text-white'
              : 'bg-blue-50 text-blue-600'
          }`}
        >
          {currentTasks.length} tasks
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-sm max-h-64 mx-auto">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {Array.from({ length: hours }).map((_, i) => {
            const angle = ((i * hourAngle - 90) * Math.PI) / 180;
            const x1 = 200 + 170 * Math.cos(angle);
            const y1 = 200 + 170 * Math.sin(angle);
            const x2 = 200 + 180 * Math.cos(angle);
            const y2 = 200 + 180 * Math.sin(angle);

            const curH = currentTime.getHours();
            const displayH = is12 ? curH % 12 || 12 : curH;
            const isCur =
              is12 ? (i === 0 ? 12 : i) === displayH : i === curH;

            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isCur
                      ? theme === 'dark'
                        ? '#60a5fa'
                        : '#3b82f6'
                      : theme === 'dark'
                      ? 'rgba(255,255,255,0.2)'
                      : '#d1d5db'
                  }
                  strokeWidth={isCur ? 2 : 1}
                />
                <text
                  x={200 + 155 * Math.cos(angle)}
                  y={200 + 155 * Math.sin(angle)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-semibold"
                  fill={
                    isCur
                      ? theme === 'dark'
                        ? '#60a5fa'
                        : '#3b82f6'
                      : theme === 'dark'
                      ? 'rgba(255,255,255,0.6)'
                      : '#6b7280'
                  }
                >
                  {is12 ? (i === 0 ? 12 : i) : i}
                </text>
              </g>
            );
          })}

          {currentTasks
            .filter((t) => true)
            .map((t) => {
              const startA = timeToAngle(t.startTime, is12);
              let endA = timeToAngle(t.endTime, is12);
              if (endA <= startA) endA += 360;
              const startR = (startA * Math.PI) / 180;
              const endR = (endA * Math.PI) / 180;
              const span = endA - startA;
              const largeArc = span > 180 ? 1 : 0;
              const outerR = 150;
              const innerR = 130;
              const midR = (outerR + innerR) / 2;
              const x1 = 200 + outerR * Math.cos(startR);
              const y1 = 200 + outerR * Math.sin(startR);
              const x2 = 200 + outerR * Math.cos(endR);
              const y2 = 200 + outerR * Math.sin(endR);
              const x3 = 200 + innerR * Math.cos(endR);
              const y3 = 200 + innerR * Math.sin(endR);
              const x4 = 200 + innerR * Math.cos(startR);
              const y4 = 200 + innerR * Math.sin(startR);
              const midA = (startR + endR) / 2;
              const labelX = 200 + midR * Math.cos(midA);
              const labelY = 200 + midR * Math.sin(midA);
              const showLabel = span > 20;

              return (
                <g key={t.id}>
                  <path
                    d={`M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`}
                    fill={t.color}
                    opacity={t.completed ? 0.4 : 0.7}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    stroke={t.completed ? 'rgba(0,0,0,0.2)' : 'none'}
                    strokeWidth="1"
                    onClick={() => setSelectedTask(t)}
                  />
                  {showLabel && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-semibold pointer-events-none"
                      fill="#ffffff"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {t.name.length > 8
                        ? t.name.slice(0, 8) + '…'
                        : t.name}
                    </text>
                  )}
                </g>
              );
            })}

          {(() => {
            const is12h = clockFormat === '12';
            const a = getCurrentTimeAngle(is12h);
            const r = (a * Math.PI) / 180;
            const len = 150;
            const x = 200 + len * Math.cos(r);
            const y = 200 + len * Math.sin(r);
            return (
              <g>
                <line
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <circle cx={x} cy={y} r="5" fill="#ef4444" />
                <line
                  x1={x}
                  y1={y}
                  x2={200 + 120 * Math.cos(r)}
                  y2={200 + 120 * Math.sin(r)}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  opacity="0.5"
                />
              </g>
            );
          })()}

          <circle
            cx="200"
            cy="200"
            r="100"
            fill={theme === 'dark' ? '#1f2937' : '#ffffff'}
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}
            strokeWidth="2"
          />
          <text
            x="200"
            y="190"
            textAnchor="middle"
            className="text-2xl font-bold"
            fill={theme === 'dark' ? '#ffffff' : '#1f2937'}
          >
            {formatTime(currentTime, is12)}
          </text>
          <text
            x="200"
            y="210"
            textAnchor="middle"
            className="text-xs"
            fill={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          >
            {selectedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </text>
        </svg>

        <button
          onClick={() => navigateDate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
        >
          <ChevronLeft
            size={20}
            className={theme === 'dark' ? 'text-white' : 'text-gray-900'}
          />
        </button>
        <button
          onClick={() => navigateDate(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full shadow-lg border bg-white dark:bg-gray-700 dark:border-gray-600 border-gray-200 hover:opacity-80"
        >
          <ChevronRight
            size={20}
            className={theme === 'dark' ? 'text-white' : 'text-gray-900'}
          />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {!currentTasks.length ? (
          <div className="text-center py-4">
            <p
              className={
                theme === 'dark'
                  ? 'text-gray-400 text-sm'
                  : 'text-gray-500 text-sm'
              }
            >
              No tasks scheduled for this day
            </p>
          </div>
        ) : (
          currentTasks.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all group ${
                selectedTasks.has(t.id)
                  ? theme === 'dark'
                    ? 'bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-blue-50 border-2 border-blue-500'
                  : theme === 'dark'
                  ? 'bg-gray-700/50 hover:bg-gray-700'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <div className="flex-1 min-w-0" onClick={() => setSelectedTask(t)}>
                <p
                  className={`text-sm font-semibold truncate ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {t.name}
                </p>
                <p
                  className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {clockFormat === '12'
                    ? `${formatTime12Hour(t.startTime)} – ${formatTime12Hour(
                        t.endTime
                      )}`
                    : `${t.startTime} – ${t.endTime}`}{' '}
                  · {Math.floor(t.duration / 60)}h {t.duration % 60}m
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!t.completed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskComplete(t.id);
                    }}
                    className="p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500"
                    title="Mark as completed"
                  >
                    <CheckCircle size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTask(t);
                  }}
                  className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  title="Edit task"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this task?')) {
                      deleteTask(t.id);
                    }
                  }}
                  className={`p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500`}
                  title="Delete task"
                >
                  <X size={14} />
                </button>
              </div>
              {t.completed && (
                <CheckCircle
                  size={16}
                  className={
                    theme === 'dark'
                      ? 'text-green-400 flex-shrink-0'
                      : 'text-green-500 flex-shrink-0'
                  }
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClockView;
