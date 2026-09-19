import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Trash2,
  Check,
  ShieldCheck,
  ShieldAlert,
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
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    dailyReminderEnabled,
    dailyReminderTime,
    setDailyReminder,
    alerts,
    markAlertAsRead,
    clearAllAlerts,
  } = useNotifications();

  const [reminderTime, setReminderTime] = useState<string>(dailyReminderTime);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(dailyReminderEnabled);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleSaveReminder = () => {
    setDailyReminder(reminderEnabled, reminderTime);
  };

  const handleSendTest = () => {
    sendNotification('Sinahard Pro Test Alert', {
      body: 'Notifications are working perfectly! You are set to receive study reminders.',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[32px] bg-white/95 dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden text-zinc-900 dark:text-white backdrop-blur-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-white/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 flex items-center justify-center shadow-2xs">
              <Bell className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Outfit',sans-serif]">Push & Study Notifications</h3>
              <p className="text-xs text-zinc-500">Configure browser push alerts and study cadence</p>
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
          {/* Permission Status Banner */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {permission === 'granted' ? (
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Browser Push Status
                </div>
                <div className="text-sm font-bold capitalize text-zinc-900 dark:text-white">
                  {permission === 'granted'
                    ? 'Active & Permitted'
                    : permission === 'denied'
                    ? 'Blocked by Browser'
                    : 'Permission Not Requested'}
                </div>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={requestPermission}
                className="px-4 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs cursor-pointer transition shadow-xs active:scale-98"
              >
                Enable Push Alerts
              </button>
            )}
          </div>

          {/* Daily Study Schedule */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  Daily Practice Reminder
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Receive a gentle prompt every day to complete a short quiz session
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
                <label className="text-xs font-semibold text-zinc-500">Reminder Time:</label>
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
              <span className="text-xs text-zinc-500">Verify notification delivery:</span>
              <button
                type="button"
                onClick={handleSendTest}
                className="px-3.5 py-1.5 rounded-full border border-white/60 dark:border-white/10 bg-white/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                {testSent ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Send className="w-3.5 h-3.5 text-zinc-500" />}
                {testSent ? 'Test Alert Sent!' : 'Send Test Notification'}
              </button>
            </div>
          </div>

          {/* In-App Notification Center */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
                Notification History ({alerts.length})
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
                        {!alert.read && <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white" />}
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
