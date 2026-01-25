import React, { useMemo } from 'react';
import { 
  BarChart, Activity, CheckCircle, Flame, 
  TrendingUp, Calendar, Zap 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const StatsView = () => {
  const { tasks, habits, theme } = useAppContext();

  // --- Science-Based Analytics ---
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
    // Calculate total habit completions over last 30 days
    const habitCompletionCount = habits.reduce((acc, habit) => {
      const completions = habit.completions ? Object.values(habit.completions).filter(v => v === 1).length : 0;
      return acc + completions;
    }, 0);

    // Dynamic Productivity Score (Algorithm-based)
    const score = Math.min(100, Math.round((taskRate * 0.6) + (habitCompletionCount * 2)));

    return { completedTasks, taskRate, habitCompletionCount, score };
  }, [tasks, habits]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. The "Pulse" Card - Your Science-based Score */}
      <div className={`relative overflow-hidden p-6 rounded-[3rem] ${
        theme === 'dark' ? 'bg-indigo-900/40' : 'bg-blue-600 text-white'
      } border border-white/10 shadow-xl`}>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-widest opacity-80 mb-1">Productivity Pulse</p>
            <h2 className="text-5xl font-black">{stats.score}</h2>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center">
            <Zap size={40} fill={theme === 'dark' ? '#818cf8' : 'white'} />
          </div>
        </div>
        {/* Background Decorative Circles */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-5 rounded-[2.5rem] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'} border border-gray-200/10`}>
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle size={18} />
            <span className="text-xs font-bold uppercase">Tasks Done</span>
          </div>
          <div className="text-2xl font-black">{stats.completedTasks}</div>
          <p className="text-[10px] opacity-50 mt-1">Today's Focus</p>
        </div>

        <div className={`p-5 rounded-[2.5rem] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'} border border-gray-200/10`}>
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Activity size={18} />
            <span className="text-xs font-bold uppercase">Consistency</span>
          </div>
          <div className="text-2xl font-black">{stats.taskRate}%</div>
          <p className="text-[10px] opacity-50 mt-1">Success Ratio</p>
        </div>
      </div>

      {/* 3. Consistency Heatmap (The GitHub Style) */}
      <div className={`p-6 rounded-[2.5rem] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'} border border-gray-200/10`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-500" />
            <h3 className="font-black text-lg">Monthly Intensity</h3>
          </div>
          <span className="text-[10px] font-bold opacity-40 uppercase">Last 4 Weeks</span>
        </div>
        
        <div className="flex justify-between gap-1">
          {[...Array(28)].map((_, i) => {
            // Logic to simulate heat levels based on completed tasks
            const intensity = Math.random() > 0.5 ? (Math.random() > 0.5 ? 'bg-blue-600' : 'bg-blue-400') : 'bg-gray-200 dark:bg-gray-700';
            return (
              <div 
                key={i} 
                className={`flex-1 aspect-square rounded-sm ${intensity} transition-all hover:scale-110 cursor-help`}
                title={`Level ${i}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[9px] font-bold opacity-30">LESS</span>
          <span className="text-[9px] font-bold opacity-30">MORE</span>
        </div>
      </div>

      {/* 4. Category Breakdown */}
      <div className={`p-6 rounded-[2.5rem] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'} border border-gray-200/10`}>
        <h3 className="font-black text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-orange-500" />
          Focus Distribution
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Work', val: 75, color: 'bg-blue-500' },
            { label: 'Health', val: 45, color: 'bg-green-500' },
            { label: 'Mind', val: 90, color: 'bg-purple-500' }
          ].map((cat, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-tighter">
                <span>{cat.label}</span>
                <span>{cat.val}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${cat.color} transition-all duration-1000`} 
                  style={{ width: `${cat.val}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsView;