import React, { useState } from 'react';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Bell,
    CheckCircle,
    Clock,
    Repeat,
    Trash2,
    Plus
} from 'lucide-react';
import { colorPalette, iconOptions, getNextUnusedColor } from '../constants/habits';

const HabitForm = ({ onSave, onCancel, theme, habit = null, existingHabits = [], scheduleHabitReminders }) => {
    const [name, setName] = useState(habit?.name || '');
    const [frequencyType, setFrequencyType] = useState(habit?.frequencyType || 'daily');
    const [targetCount, setTargetCount] = useState(habit?.targetCount || 1);
    const [color, setColor] = useState(habit?.color || getNextUnusedColor(existingHabits));
    const [icon, setIcon] = useState(habit?.icon || '🎯');
    const [reminders, setReminders] = useState(habit?.reminders || [
        { enabled: true, type: 'specific', times: ['09:00'], message: 'Time for your habit!' }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const updatedHabit = {
            id: habit?.id || Date.now(),
            name: name.trim(),
            description: habit?.description || '',
            color,
            icon,
            frequencyType,
            targetCount: Number(targetCount) || 1,
            reminders: reminders.filter(r => r.enabled),
            completions: habit?.completions || {},
        };

        onSave(updatedHabit);
        if (scheduleHabitReminders) {
            scheduleHabitReminders(updatedHabit);
        }
    };

    const addReminder = () => {
        setReminders(prev => [...prev, {
            enabled: true,
            type: 'specific',
            times: ['12:00'],
            message: 'Don\'t forget your habit!'
        }]);
    };

    const updateReminder = (index, updates) => {
        setReminders(prev => prev.map((reminder, i) =>
            i === index ? { ...reminder, ...updates } : reminder
        ));
    };

    const removeReminder = (index) => {
        if (reminders.length > 0) {
            setReminders(prev => prev.filter((_, i) => i !== index));
        }
    };

    const addTimeToSpecificReminder = (reminderIndex) => {
        setReminders(prev => prev.map((reminder, i) => {
            if (i === reminderIndex && reminder.type === 'specific') {
                return {
                    ...reminder,
                    times: [...reminder.times, '12:00']
                };
            }
            return reminder;
        }));
    };

    const removeTimeFromSpecificReminder = (reminderIndex, timeIndex) => {
        setReminders(prev => prev.map((reminder, i) => {
            if (i === reminderIndex && reminder.type === 'specific' && reminder.times.length > 1) {
                return {
                    ...reminder,
                    times: reminder.times.filter((_, ti) => ti !== timeIndex)
                };
            }
            return reminder;
        }));
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md`}
            onClick={onCancel}
        >
            <div
                className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-900' : 'bg-white'
                    } p-6 space-y-6 transform transition-all ${theme === 'neon' ? 'neon-panel ring-2 ring-white/10' : 'border border-gray-800'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className={`text-2xl font-bold ${(theme === 'dark' || theme === 'neon') ? 'text-white' : 'text-gray-900'}`}>
                        {habit ? 'Edit Habit' : 'New Habit'}
                    </h3>
                    <button onClick={onCancel} className={`p-2 rounded-full ${(theme === 'dark' || theme === 'neon') ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Main Info Section */}
                    <div className={`p-4 rounded-2xl ${theme === 'neon' ? 'bg-white/5' : (theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')} space-y-4`}>
                        <div>
                            <label className={`block text-xs font-bold mb-2 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-400' : 'text-gray-500'}`}>
                                Habit Name
                            </label>
                            <div className="flex gap-3">
                                <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl text-2xl shadow-sm ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                                    <select
                                        className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-10"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                    >
                                        {iconOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <span className="pointer-events-none">{icon}</span>
                                </div>
                                <input
                                    className={`flex-1 px-4 py-3 rounded-xl border-0 ring-1 ring-inset ${(theme === 'dark' || theme === 'neon')
                                        ? 'bg-gray-700 text-white ring-gray-600 focus:ring-blue-500'
                                        : 'bg-white text-gray-900 ring-gray-200 focus:ring-blue-500'
                                        } text-lg font-medium placeholder-gray-400 focus:ring-2 focus:bg-transparent transition-all`}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Drink Water"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-xs font-bold mb-2 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Frequency
                                </label>
                                <div className="relative">
                                    <select
                                        value={frequencyType}
                                        onChange={(e) => setFrequencyType(e.target.value)}
                                        className={`w-full px-3 py-2.5 rounded-xl appearance-none ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900'
                                            } font-medium focus:ring-2 focus:ring-blue-500 outline-none`}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <ChevronRight className={`absolute right-3 top-3 w-4 h-4 pointer-events-none ${(theme === 'dark' || theme === 'neon') ? 'text-gray-400' : 'text-gray-500'} rotate-90`} />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-2 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Target
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTargetCount(Math.max(1, targetCount - 1))}
                                        className={`p-2.5 rounded-xl ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div className={`flex-1 py-2.5 text-center font-bold text-lg rounded-xl ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                                        {targetCount}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTargetCount(targetCount + 1)}
                                        className={`p-2.5 rounded-xl ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-bold mb-2 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-400' : 'text-gray-500'}`}>
                                Theme Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {colorPalette.slice(0, 10).map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                                            } ${(theme === 'dark' || theme === 'neon') ? 'ring-offset-gray-800' : 'ring-offset-white'}`}
                                        style={{
                                            backgroundColor: c,
                                            boxShadow: theme === 'neon' ? (color === c ? `0 0 15px ${c}` : `0 0 5px ${c}44`) : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reminders Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${(theme === 'dark' || theme === 'neon') ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                    <Bell size={18} />
                                </div>
                                <h4 className={`font-semibold ${(theme === 'dark' || theme === 'neon') ? 'text-white' : 'text-gray-900'}`}>
                                    Reminders
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={addReminder}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${(theme === 'dark' || theme === 'neon')
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                            >
                                + Add New
                            </button>
                        </div>

                        <div className="space-y-4">
                            {reminders.length === 0 && (
                                <div className={`text-center py-8 rounded-2xl border border-dashed ${(theme === 'dark' || theme === 'neon') ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                                    <p className="text-sm">No reminders set</p>
                                </div>
                            )}

                            {reminders.map((reminder, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-2xl border transition-all ${(theme === 'dark' || theme === 'neon')
                                        ? 'bg-gray-800/40 border-gray-700 hover:border-gray-600'
                                        : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        {/* Toggle & Title */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => updateReminder(index, { enabled: !reminder.enabled })}
                                                className={`w-11 h-6 rounded-full transition-colors relative ${reminder.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${reminder.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                            <span className={`text-sm font-medium ${!reminder.enabled && 'opacity-50'} ${(theme === 'dark' || theme === 'neon') ? 'text-white' : 'text-gray-900'}`}>
                                                {reminder.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeReminder(index)}
                                            className={`p-2 rounded-lg transition-colors ${(theme === 'dark' || theme === 'neon') ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className={`space-y-4 ${!reminder.enabled && 'opacity-50 pointer-events-none'}`}>
                                        {/* Type Switcher */}
                                        <div className={`flex p-1 rounded-xl ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                                            <button
                                                type="button"
                                                onClick={() => updateReminder(index, { type: 'specific' })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${reminder.type === 'specific'
                                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                                    }`}
                                            >
                                                <Clock size={14} /> Specific Time
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateReminder(index, { type: 'interval' })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${reminder.type === 'interval'
                                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                                    }`}
                                            >
                                                <Repeat size={14} /> Interval
                                            </button>
                                        </div>

                                        {reminder.type === 'specific' ? (
                                            <div className="space-y-2">
                                                <label className={`text-xs font-semibold ${(theme === 'dark' || theme === 'neon') ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    Trigger Times
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {reminder.times.map((time, timeIndex) => (
                                                        <div key={timeIndex} className={`flex items-center pl-3 pr-1 py-1.5 rounded-lg border ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                            <input
                                                                type="time"
                                                                value={time}
                                                                onChange={(e) => {
                                                                    const newTimes = [...reminder.times];
                                                                    newTimes[timeIndex] = e.target.value;
                                                                    updateReminder(index, { times: newTimes });
                                                                }}
                                                                className={`bg-transparent text-sm font-mono focus:outline-none ${(theme === 'dark' || theme === 'neon') ? 'text-white' : 'text-gray-900'}`}
                                                            />
                                                            {reminder.times.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTimeFromSpecificReminder(index, timeIndex)}
                                                                    className="ml-1 p-1 text-gray-400 hover:text-red-500"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addTimeToSpecificReminder(index)}
                                                        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-dashed transition-colors ${(theme === 'dark' || theme === 'neon')
                                                            ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                                            : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className={`block text-xs font-semibold mb-1.5 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-500' : 'text-gray-400'}`}>Start</label>
                                                    <input
                                                        type="time"
                                                        value={reminder.startTime || '09:00'}
                                                        onChange={(e) => updateReminder(index, { startTime: e.target.value })}
                                                        className={`w-full px-2 py-2 rounded-lg text-sm border ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                                                            } focus:ring-1 focus:ring-blue-500 outline-none`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs font-semibold mb-1.5 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-500' : 'text-gray-400'}`}>End</label>
                                                    <input
                                                        type="time"
                                                        value={reminder.endTime || '18:00'}
                                                        onChange={(e) => updateReminder(index, { endTime: e.target.value })}
                                                        className={`w-full px-2 py-2 rounded-lg text-sm border ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                                                            } focus:ring-1 focus:ring-blue-500 outline-none`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs font-semibold mb-1.5 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-500' : 'text-gray-400'}`}>Every</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min={15}
                                                            max={480}
                                                            step={15}
                                                            value={reminder.interval || 120}
                                                            onChange={(e) => updateReminder(index, { interval: parseInt(e.target.value) })}
                                                            className={`w-full px-2 py-2 rounded-lg text-sm border text-center ${(theme === 'dark' || theme === 'neon') ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                                                                } focus:ring-1 focus:ring-blue-500 outline-none`}
                                                        />
                                                        <span className="absolute right-2 top-2 text-xs text-gray-500">min</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Message Input */}
                                        <div>
                                            <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${(theme === 'dark' || theme === 'neon') ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <div className="w-1 h-1 rounded-full bg-blue-500"></div> Notification Message
                                            </label>
                                            <input
                                                type="text"
                                                value={reminder.message || ''}
                                                onChange={(e) => updateReminder(index, { message: e.target.value })}
                                                placeholder="e.g. Time to focus!"
                                                className={`w-full px-3 py-2.5 rounded-xl text-sm border ${(theme === 'dark' || theme === 'neon')
                                                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600'
                                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                                    } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-3 pt-6 border-t ${(theme === 'dark' || theme === 'neon') ? 'border-gray-800' : 'border-gray-100'}`}>
                        <button
                            type="button"
                            onClick={onCancel}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${(theme === 'dark' || theme === 'neon')
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] px-4 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {habit ? 'Save Changes' : 'Create Habit'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default HabitForm;
