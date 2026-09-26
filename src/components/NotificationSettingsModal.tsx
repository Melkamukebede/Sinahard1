import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Target,
  Flame,
  CheckCircle2,
  X,
  Send,
  Trash2,
  Check,
  Award,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    dailyGoal,
    setDailyGoal,
    completedToday,
    studyStreakDays,
    dailyReminderEnabled,
    dailyReminderTime,
    setDailyReminder,
    alerts,
    markAlertAsRead,
    clearAllAlerts,
    sendNotification,
  } = useNotifications();

  const [reminderTime, setReminderTime] = useState<string>(dailyReminderTime);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(dailyReminderEnabled);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleSaveReminder = () => {
    setDailyReminder(reminderEnabled, reminderTime);
  };

  const handleSendTest = () => {
    sendNotification('Study Milestone Unlocked! 🎯', {
      body: `You are on a ${studyStreakDays}-day practice streak. Keep up the high performance!`,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[32px] bg-white/95 dark:bg-[000000] border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden text-zinc-900 dark:text-white backdrop-blur-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-white/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 flex items-center justify-center shadow-2xs">
              <Target className="w-4 h-4 text-zinc-900 dark:text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Outfit',sans-serif]">Study Targets & Alerts</h3>
              <p className="text-xs text-zinc-500">Track daily practice goal, study streak, and exam results</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Daily Goal & Streak Hero Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Streak Card */}
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Study Consistency
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>{studyStreakDays} Day Streak</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Practicing regularly boosts retention</p>
              </div>
            </div>

            {/* Daily Target Card */}
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Today's Progress
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-white">
                  {completedToday} / {dailyGoal} Exams
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {completedToday >= dailyGoal ? 'Goal completed! 🌟' : `${dailyGoal - completedToday} more to reach target`}
                </div>
              </div>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-zinc-900 dark:text-white" />
                  Daily Exam Goal
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Set how many practice exams or quizzes you want to complete each day
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {[1, 2, 3, 5].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setDailyGoal(target)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs cursor-pointer border transition flex flex-col items-center gap-0.5 ${
                    dailyGoal === target
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-sm font-black">{target}</span>
                  <span className="text-[10px] opacity-80">{target === 1 ? 'Exam/day' : 'Exams/day'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Schedule Prompt */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  Preferred Study Time
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Designate your peak study hour for consistent focus
                </p>
              </div>

              {/* Switch Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white" />
              </label>
            </div>

            {reminderEnabled && (
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-semibold text-zinc-500">Study Hour:</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveReminder}
                  className="px-4 py-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs cursor-pointer transition shadow-xs"
                >
                  Save Time
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Test in-app alert banner:</span>
              <button
                type="button"
                onClick={handleSendTest}
                className="px-3.5 py-1.5 rounded-full border border-white/60 dark:border-white/10 bg-white/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                {testSent ? <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-white" /> : <Send className="w-3.5 h-3.5 text-zinc-500" />}
                {testSent ? 'Alert Sent!' : 'Preview In-App Alert'}
              </button>
            </div>
          </div>

          {/* In-App Notification Center */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
                Recent Alerts & Milestones ({alerts.length})
              </h4>
              {alerts.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllAlerts}
                  className="text-xs text-zinc-500 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">No alerts yet</div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => markAlertAsRead(alert.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1 ${
                      alert.read
                        ? 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50 opacity-70'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        {!alert.read && <span className="w-2 h-2 rounded-full bg-zinc-950 dark:bg-white" />}
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{alert.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs cursor-pointer shadow-xs active:scale-98 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

