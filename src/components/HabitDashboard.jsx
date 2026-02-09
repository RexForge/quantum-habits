import React, { useState } from 'react';
import {
  Plus, CheckCircle, Flame, Calendar,
  ChevronRight, Trash2, Edit2, TrendingUp
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toDateStr } from '../utils/timeHelpers';

const HabitDashboard = () => {
  const {
    habits, toggleHabitCompletion, theme, triggerHaptic,
    setEditingHabit, setShowAddHabit, deleteHabit,
    setSelectedHabitForCalendar
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('all');
  const todayStr = toDateStr(new Date());

  // --- Logic Helpers ---
  const getStreak = (completions) => {
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

  const getCompletionRate = (completions) => {
    if (!completions) return 0;
    const values = Object.values(completions);
    if (values.length === 0) return 0;
    const done = values.filter(v => v === 1).length;
    return Math.round((done / 30) * 100); // Rate over last 30 days
  };

  const filteredHabits = habits.filter(h =>
    activeTab === 'all' ? true : h.category?.toLowerCase() === activeTab
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* --- Stats Overview Cards --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-3xl bg-panel ${theme === 'dark' ? '' : 'shadow-sm'} border border-gray-200/10`}>
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Flame size={18} />
            <span className="text-sm font-bold">Best Streak</span>
          </div>
          <div className="text-2xl font-black">12 Days</div>
        </div>
        <div className={`p-4 rounded-3xl bg-panel ${theme === 'dark' ? '' : 'shadow-sm'} border border-gray-200/10`}>
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <TrendingUp size={18} />
            <span className="text-sm font-bold">Completion</span>
          </div>
          <div className="text-2xl font-black">84%</div>
        </div>
      </div>

      {/* --- Category Tabs --- */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'health', 'work', 'mind'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab
              ? 'bg-blue-600 text-white'
              : theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- Habit List --- */}
      <div className="space-y-4">
        {filteredHabits.map((habit) => {
          const streak = getStreak(habit.completions);
          const isDoneToday = !!habit.completions?.[todayStr];

          return (
            <div
              key={habit.id}
              onClick={() => setSelectedHabitForCalendar(habit)}
              className={`p-5 rounded-[2.5rem] transition-all cursor-pointer ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } border border-gray-200/10 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg"
                    style={{ backgroundColor: habit.color || '#3b82f6' }}
                  >
                    {habit.icon || '★'}
                  </div>
                  <div>
                    <h4 className="font-black text-lg leading-tight">{habit.name}</h4>
                    <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase">
                      <Flame size={14} fill="currentColor" />
                      {streak} Day Streak
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDoneToday
                    ? 'bg-green-100 text-green-600 scale-95'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}
                >
                  <CheckCircle size={28} />
                </button>
              </div>

              {/* Mini Heatmap (Last 7 Days) */}
              <div className="flex justify-between items-center gap-1 px-1">
                {[...Array(7)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const dStr = toDateStr(d);
                  const active = habit.completions?.[dStr];
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHabitCompletion(habit.id, d);
                        }}
                        className={`w-8 h-8 rounded-lg transition-all ${active
                          ? 'bg-blue-500 shadow-md scale-105'
                          : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                      />
                      <span className="text-[10px] font-bold opacity-40">
                        {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {
        filteredHabits.length === 0 && (
          <div className="text-center py-12 opacity-40">
            <p className="font-bold">No habits found in this category.</p>
          </div>
        )
      }
    </div >
  );
};

export default HabitDashboard;
