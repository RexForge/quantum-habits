import React, { useMemo } from 'react';
import { 
  Clock, CheckCircle, AlertCircle, 
  ArrowRight, Zap, Trophy 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatTime, toDateStr } from '../utils/timeHelpers';

const WidgetDashboard = () => {
  const { tasks, habits, theme, currentTime, setViewMode } = useAppContext();

  // --- Widget Logic: Current Task & Progress ---
  const todayStr = toDateStr(new Date());
  
  const metrics = useMemo(() => {
    const todayTasks = tasks.filter(t => (t.date || todayStr) === todayStr);
    const completed = todayTasks.filter(t => t.completed).length;
    
    // Find what's happening RIGHT NOW
    const nowM = currentTime.getHours() * 60 + currentTime.getMinutes();
    const activeTask = todayTasks.find(t => {
      const [sh, sm] = t.startTime.split(':').map(Number);
      const [eh, em] = t.endTime.split(':').map(Number);
      const startM = sh * 60 + sm;
      const endM = eh * 60 + em;
      return nowM >= startM && nowM <= endM && !t.completed;
    });

    const nextTask = todayTasks
      .filter(t => {
        const [sh, sm] = t.startTime.split(':').map(Number);
        return (sh * 60 + sm) > nowM && !t.completed;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

    return { 
      total: todayTasks.length, 
      completed, 
      activeTask, 
      nextTask,
      progress: todayTasks.length > 0 ? (completed / todayTasks.length) * 100 : 0
    };
  }, [tasks, currentTime, todayStr]);

  return (
    <div className="space-y-4">
      {/* 1. "The Now" Widget */}
      <div className={`p-6 rounded-[2.5rem] border bg-panel ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-100 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Live Now</span>
        </div>

        {metrics.activeTask ? (
          <div className="space-y-3">
            <h4 className="text-xl font-black leading-tight">{metrics.activeTask.name}</h4>
            <div className="flex items-center gap-3 text-sm font-bold opacity-70">
              <Clock size={16} />
              <span>Ends at {metrics.activeTask.endTime}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000" 
                style={{ width: '45%' }} // You can calculate real % based on current time
              />
            </div>
          </div>
        ) : (
          <p className="text-sm font-bold opacity-40 italic">No active tasks right now.</p>
        )}
      </div>

      {/* 2. Daily Momentum Widget */}
      <div className={`p-6 rounded-[2.5rem] ${
        theme === 'dark' ? 'bg-blue-900/20 border-blue-500/20' : 'bg-blue-50 border-blue-100'
      } border`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-black text-lg">Today's Goal</h4>
            <p className="text-xs font-bold opacity-60">{metrics.completed} / {metrics.total} Completed</p>
          </div>
          <Trophy className="text-blue-500" size={24} />
        </div>
        
        {/* Progress Ring or Bar */}
        <div className="relative h-3 w-full bg-blue-200/30 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-700"
            style={{ width: `${metrics.progress}%` }}
          />
        </div>
      </div>

      {/* 3. Up Next Widget */}
      {metrics.nextTask && (
        <button 
          onClick={() => setViewMode('day')}
          className={`w-full p-5 rounded-[2.5rem] flex items-center justify-between group transition-all ${
            theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase opacity-40">Coming up</p>
              <h5 className="font-bold text-sm">{metrics.nextTask.name}</h5>
            </div>
          </div>
          <span className="text-xs font-black opacity-40">{metrics.nextTask.startTime}</span>
        </button>
      )}

      {/* 4. Quick Tip / Dopamine Nugget */}
      <div className="p-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-[10px] font-black uppercase">
          <Zap size={12} fill="currentColor" />
          Pro Tip
        </div>
        <p className="mt-2 text-[11px] font-medium opacity-50 px-4">
          Finish your "Up Next" task to boost your productivity score by +5 points!
        </p>
      </div>
    </div>
  );
};

export default WidgetDashboard;
